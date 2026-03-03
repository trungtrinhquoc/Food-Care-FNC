using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;

namespace FoodCare.API.Services.Implementations.StaffModule;

public class SupplierInboundService : ISupplierInboundService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<SupplierInboundService> _logger;

    public SupplierInboundService(FoodCareDbContext context, ILogger<SupplierInboundService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all inbound sessions where this supplier has been invited or registered.
    /// Also auto-discovers nearby sessions (same ward/district/city) that the supplier
    /// hasn't been invited to yet (handles case where invitation silently failed).
    /// Only returns sessions that are still active (Draft/Processing) and not expired.
    /// </summary>
    public async Task<List<SupplierInboundSessionDto>> GetAvailableSessionsForSupplierAsync(int supplierId)
    {
        var now = DateTime.UtcNow;

        // 1) Get explicitly invited/registered sessions
        var registrations = await _context.InboundSessionSuppliers
            .Include(r => r.Session)
                .ThenInclude(s => s.Warehouse)
            .Where(r => r.SupplierId == supplierId)
            .Where(r => r.Session.Status != InboundSessionStatus.Completed
                     && r.Session.Status != InboundSessionStatus.Cancelled)
            .Where(r => r.Session.ExpectedEndDate == null || r.Session.ExpectedEndDate > now)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var results = registrations.Select(r => MapToSupplierDto(r)).ToList();
        var existingSessionIds = results.Select(r => r.SessionId).ToHashSet();

        // 2) Auto-discover nearby sessions that supplier hasn't been invited to
        //    (fallback for when InviteSuppliersForSessionAsync failed silently)
        try
        {
            var supplier = await _context.Suppliers.FindAsync(supplierId);
            if (supplier != null && !string.IsNullOrEmpty(supplier.AddressCity))
            {
                var nearbySessions = await FindNearbySessionsAsync(supplier, existingSessionIds, now);

                // Auto-create invitations for discovered sessions
                foreach (var session in nearbySessions)
                {
                    var invitation = new InboundSessionSupplier
                    {
                        Id = Guid.NewGuid(),
                        SessionId = session.Id,
                        SupplierId = supplierId,
                        Status = "Invited",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    };
                    _context.InboundSessionSuppliers.Add(invitation);

                    results.Add(new SupplierInboundSessionDto
                    {
                        SessionId = session.Id,
                        SessionCode = session.SessionCode,
                        WarehouseName = session.Warehouse?.Name,
                        WarehouseWard = session.Warehouse?.AddressWard,
                        WarehouseDistrict = session.Warehouse?.AddressDistrict,
                        WarehouseCity = session.Warehouse?.AddressCity,
                        WarehouseAddress = FormatAddress(session.Warehouse),
                        SessionStatus = session.Status.ToString(),
                        ExpectedEndDate = session.ExpectedEndDate,
                        CreatedAt = session.CreatedAt,
                        RegistrationId = invitation.Id,
                        RegistrationStatus = "Invited",
                    });
                }

                if (nearbySessions.Any())
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation(
                        "Auto-discovered and invited supplier {SupplierId} to {Count} nearby sessions",
                        supplierId, nearbySessions.Count);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to auto-discover nearby sessions for supplier {SupplierId}", supplierId);
        }

        return results.OrderByDescending(r => r.CreatedAt).ToList();
    }

    /// <summary>
    /// Find active sessions near the supplier's location that they haven't been invited to.
    /// </summary>
    private async Task<List<InboundSession>> FindNearbySessionsAsync(
        Models.Suppliers.Supplier supplier, HashSet<Guid> excludeSessionIds, DateTime now)
    {
        var query = _context.InboundSessions
            .Include(s => s.Warehouse)
            .Where(s => s.Status != InboundSessionStatus.Completed
                     && s.Status != InboundSessionStatus.Cancelled)
            .Where(s => s.ExpectedEndDate == null || s.ExpectedEndDate > now)
            .Where(s => s.Warehouse != null);

        if (excludeSessionIds.Any())
            query = query.Where(s => !excludeSessionIds.Contains(s.Id));

        var sessions = await query.ToListAsync();

        // Filter in-memory for address matching
        return sessions.Where(s =>
        {
            var w = s.Warehouse!;
            if (string.IsNullOrEmpty(w.AddressCity)) return false;

            var cityMatch = string.Equals(w.AddressCity, supplier.AddressCity, StringComparison.OrdinalIgnoreCase);
            if (!cityMatch) return false;

            // Ward match (tightest)
            if (!string.IsNullOrEmpty(w.AddressWard) && !string.IsNullOrEmpty(supplier.AddressWard)
                && string.Equals(w.AddressWard, supplier.AddressWard, StringComparison.OrdinalIgnoreCase))
                return true;

            // District match
            if (!string.IsNullOrEmpty(w.AddressDistrict) && !string.IsNullOrEmpty(supplier.AddressDistrict)
                && string.Equals(w.AddressDistrict, supplier.AddressDistrict, StringComparison.OrdinalIgnoreCase))
                return true;

            return false;
        }).ToList();
    }

    /// <summary>
    /// Supplier confirms registration: changes status from Invited → Registered.
    /// </summary>
    public async Task<SupplierInboundSessionDto> RegisterForSessionAsync(
        Guid sessionId, int supplierId, SupplierRegisterInboundRequest request)
    {
        var registration = await _context.InboundSessionSuppliers
            .Include(r => r.Session)
                .ThenInclude(s => s.Warehouse)
            .FirstOrDefaultAsync(r => r.SessionId == sessionId && r.SupplierId == supplierId)
            ?? throw new KeyNotFoundException("Không tìm thấy lời mời cho phiên nhập này");

        if (registration.Status != "Invited" && registration.Status != "Declined")
            throw new InvalidOperationException($"Không thể đăng ký. Trạng thái hiện tại: {registration.Status}");

        // Verify session is still active
        if (registration.Session.Status == InboundSessionStatus.Completed ||
            registration.Session.Status == InboundSessionStatus.Cancelled)
            throw new InvalidOperationException("Phiên nhập đã kết thúc hoặc bị huỷ");

        if (registration.Session.ExpectedEndDate.HasValue && registration.Session.ExpectedEndDate <= DateTime.UtcNow)
            throw new InvalidOperationException("Phiên nhập đã hết hạn");

        // Validate: estimated delivery date must be before session deadline
        if (request.EstimatedDeliveryDate.HasValue && registration.Session.ExpectedEndDate.HasValue)
        {
            if (request.EstimatedDeliveryDate.Value > registration.Session.ExpectedEndDate.Value)
            {
                var deadline = registration.Session.ExpectedEndDate.Value.ToString("dd/MM/yyyy HH:mm");
                throw new InvalidOperationException(
                    $"Thời gian giao hàng dự kiến phải trước hạn đóng phiên ({deadline}). " +
                    $"Vui lòng chọn thời gian sớm hơn.");
            }
        }

        registration.Status = "Registered";
        registration.Note = request.Note;
        registration.EstimatedDeliveryDate = request.EstimatedDeliveryDate;
        registration.RegisteredAt = DateTime.UtcNow;
        registration.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Supplier {SupplierId} registered for session {SessionId}", supplierId, sessionId);

        return MapToSupplierDto(registration);
    }

    /// <summary>
    /// Supplier declines an invitation.
    /// </summary>
    public async Task DeclineSessionAsync(Guid sessionId, int supplierId)
    {
        var registration = await _context.InboundSessionSuppliers
            .FirstOrDefaultAsync(r => r.SessionId == sessionId && r.SupplierId == supplierId)
            ?? throw new KeyNotFoundException("Không tìm thấy lời mời cho phiên nhập này");

        if (registration.Status == "Completed")
            throw new InvalidOperationException("Không thể từ chối phiên đã hoàn thành");

        registration.Status = "Declined";
        registration.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Supplier {SupplierId} declined session {SessionId}", supplierId, sessionId);
    }

    /// <summary>
    /// Admin view: get all supplier registrations for a session.
    /// </summary>
    public async Task<List<InboundSessionSupplierDto>> GetSessionSuppliersAsync(Guid sessionId)
    {
        var registrations = await _context.InboundSessionSuppliers
            .Include(r => r.Supplier)
            .Where(r => r.SessionId == sessionId)
            .OrderBy(r => r.Status)
            .ThenByDescending(r => r.RegisteredAt)
            .ToListAsync();

        return registrations.Select(r => new InboundSessionSupplierDto
        {
            RegistrationId = r.Id,
            SupplierId = r.SupplierId,
            SupplierName = r.Supplier?.StoreName,
            SupplierPhone = r.Supplier?.ContactPhone,
            SupplierEmail = r.Supplier?.ContactEmail,
            SupplierWard = r.Supplier?.AddressWard,
            SupplierDistrict = r.Supplier?.AddressDistrict,
            Status = r.Status,
            Note = r.Note,
            EstimatedDeliveryDate = r.EstimatedDeliveryDate,
            RegisteredAt = r.RegisteredAt,
            CreatedAt = r.CreatedAt,
        }).ToList();
    }

    /// <summary>
    /// Auto-invite suppliers in the same ward (phường) + city as the warehouse.
    /// Matching hierarchy: Ward → District → City (fallback).
    /// Called after session creation.
    /// </summary>
    public async Task InviteSuppliersForSessionAsync(Guid sessionId)
    {
        var session = await _context.InboundSessions
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session?.Warehouse == null)
        {
            _logger.LogWarning("Session {SessionId} or warehouse not found for supplier invitation", sessionId);
            return;
        }

        var warehouseWard = session.Warehouse.AddressWard;
        var warehouseDistrict = session.Warehouse.AddressDistrict;
        var warehouseCity = session.Warehouse.AddressCity;

        if (string.IsNullOrEmpty(warehouseCity))
        {
            _logger.LogWarning("Warehouse {WarehouseId} has no city set, cannot invite suppliers", session.WarehouseId);
            return;
        }

        // Step 1: Find suppliers in the same Ward + City (tightest match)
        var matchedSupplierIds = new List<int>();

        if (!string.IsNullOrEmpty(warehouseWard))
        {
            matchedSupplierIds = await _context.Suppliers
                .Where(s => s.IsActive != false)
                .Where(s => s.RegistrationStatus == "approved")
                .Where(s => s.AddressCity != null
                         && s.AddressCity.ToLower() == warehouseCity.ToLower())
                .Where(s => s.AddressWard != null
                         && s.AddressWard.ToLower() == warehouseWard.ToLower())
                .Select(s => s.Id)
                .ToListAsync();

            _logger.LogInformation(
                "Ward-level match for '{Ward}, {City}': found {Count} suppliers",
                warehouseWard, warehouseCity, matchedSupplierIds.Count);
        }

        // Step 2: Fallback to same District + City
        if (!matchedSupplierIds.Any() && !string.IsNullOrEmpty(warehouseDistrict))
        {
            matchedSupplierIds = await _context.Suppliers
                .Where(s => s.IsActive != false)
                .Where(s => s.RegistrationStatus == "approved")
                .Where(s => s.AddressCity != null
                         && s.AddressCity.ToLower() == warehouseCity.ToLower())
                .Where(s => s.AddressDistrict != null
                         && s.AddressDistrict.ToLower() == warehouseDistrict.ToLower())
                .Select(s => s.Id)
                .ToListAsync();

            _logger.LogInformation(
                "No ward match, district fallback '{District}, {City}': found {Count}",
                warehouseDistrict, warehouseCity, matchedSupplierIds.Count);
        }

        // Step 3: Fallback to same City
        if (!matchedSupplierIds.Any())
        {
            matchedSupplierIds = await _context.Suppliers
                .Where(s => s.IsActive != false)
                .Where(s => s.RegistrationStatus == "approved")
                .Where(s => s.AddressCity != null
                         && s.AddressCity.ToLower() == warehouseCity.ToLower())
                .Select(s => s.Id)
                .ToListAsync();

            _logger.LogInformation(
                "No district match, city fallback '{City}': found {Count}",
                warehouseCity, matchedSupplierIds.Count);
        }

        // Check for existing invitations to avoid duplicates
        var existingSupplierIds = await _context.InboundSessionSuppliers
            .Where(r => r.SessionId == sessionId)
            .Select(r => r.SupplierId)
            .ToListAsync();

        var newInvitations = matchedSupplierIds
            .Where(id => !existingSupplierIds.Contains(id))
            .Select(supplierId => new InboundSessionSupplier
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                SupplierId = supplierId,
                Status = "Invited",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            })
            .ToList();

        if (newInvitations.Any())
        {
            _context.InboundSessionSuppliers.AddRange(newInvitations);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Invited {Count} suppliers for session {SessionCode} (ward: {Ward}, district: {District}, city: {City})",
                newInvitations.Count, session.SessionCode, warehouseWard, warehouseDistrict, warehouseCity);
        }
        else
        {
            _logger.LogInformation(
                "No new suppliers to invite for session {SessionCode} in ward {Ward}, district {District}, city {City}",
                session.SessionCode, warehouseWard, warehouseDistrict, warehouseCity);
        }
    }

    private static SupplierInboundSessionDto MapToSupplierDto(InboundSessionSupplier r)
    {
        var warehouse = r.Session?.Warehouse;
        return new SupplierInboundSessionDto
        {
            SessionId = r.SessionId,
            SessionCode = r.Session?.SessionCode ?? "",
            WarehouseName = warehouse?.Name,
            WarehouseWard = warehouse?.AddressWard,
            WarehouseDistrict = warehouse?.AddressDistrict,
            WarehouseCity = warehouse?.AddressCity,
            WarehouseAddress = FormatAddress(warehouse),
            SessionStatus = r.Session?.Status.ToString() ?? "",
            ExpectedEndDate = r.Session?.ExpectedEndDate,
            CreatedAt = r.Session?.CreatedAt ?? r.CreatedAt,
            RegistrationId = r.Id,
            RegistrationStatus = r.Status,
            RegistrationNote = r.Note,
            EstimatedDeliveryDate = r.EstimatedDeliveryDate,
            RegisteredAt = r.RegisteredAt,
        };
    }

    private static string? FormatAddress(Warehouse? w)
    {
        if (w == null) return null;
        var parts = new[] { w.AddressStreet, w.AddressWard, w.AddressDistrict, w.AddressCity }
            .Where(p => !string.IsNullOrEmpty(p));
        return string.Join(", ", parts);
    }
}
