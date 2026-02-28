using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.Staff;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;

namespace FoodCare.API.Services.Implementations.StaffModule;

/// <summary>
/// Inbound Session service - manages "Phiên nhập kho" workflow.
/// Key feature: auto-groups items by SupplierId into separate receipts.
/// </summary>
public class InboundSessionService : IInboundSessionService
{
    private readonly FoodCareDbContext _context;

    public InboundSessionService(FoodCareDbContext context)
    {
        _context = context;
    }

    // =====================================================
    // QUERIES
    // =====================================================

    public async Task<PagedResponse<InboundSessionDto>> GetSessionsAsync(
        int page, int pageSize, Guid? warehouseId, string? status)
    {
        var query = _context.InboundSessions
            .Include(s => s.Warehouse)
            .Include(s => s.CreatedByStaff).ThenInclude(st => st.User)
            .Include(s => s.Receipts).ThenInclude(r => r.Details)
            .AsQueryable();

        if (warehouseId.HasValue)
            query = query.Where(s => s.WarehouseId == warehouseId.Value);

        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<InboundSessionStatus>(status, true, out var statusEnum))
                query = query.Where(s => s.Status == statusEnum);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<InboundSessionDto>
        {
            Items = items.Select(MapSessionToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<InboundSessionDto?> GetSessionByIdAsync(Guid sessionId)
    {
        var session = await GetSessionWithIncludes()
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        return session != null ? MapSessionToDto(session) : null;
    }

    // =====================================================
    // CREATE SESSION
    // =====================================================

    public async Task<InboundSessionDto> CreateSessionAsync(
        CreateInboundSessionRequest request, Guid staffId)
    {
        var sessionCode = await GenerateSessionCode();

        var session = new InboundSession
        {
            Id = Guid.NewGuid(),
            SessionCode = sessionCode,
            WarehouseId = request.WarehouseId,
            CreatedBy = staffId,
            Status = InboundSessionStatus.Draft,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow
        };

        _context.InboundSessions.Add(session);
        await _context.SaveChangesAsync();

        return await GetSessionByIdAsync(session.Id)
            ?? throw new InvalidOperationException("Failed to create session");
    }

    // =====================================================
    // ADD ITEMS (auto-group by supplier)
    // =====================================================

    public async Task<InboundSessionDto> AddItemAsync(
        Guid sessionId, AddInboundItemRequest request, Guid staffId)
    {
        var session = await _context.InboundSessions
            .Include(s => s.Receipts).ThenInclude(r => r.Details)
            .FirstOrDefaultAsync(s => s.Id == sessionId)
            ?? throw new KeyNotFoundException($"Session {sessionId} not found");

        if (session.Status != InboundSessionStatus.Draft)
            throw new InvalidOperationException("Can only add items to Draft sessions");

        await AddItemToSession(session, request);
        RecalculateSessionTotals(session);

        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetSessionByIdAsync(sessionId)
            ?? throw new InvalidOperationException("Session not found after update");
    }

    public async Task<InboundSessionDto> AddItemsBatchAsync(
        Guid sessionId, AddInboundItemsBatchRequest request, Guid staffId)
    {
        var session = await _context.InboundSessions
            .Include(s => s.Receipts).ThenInclude(r => r.Details)
            .FirstOrDefaultAsync(s => s.Id == sessionId)
            ?? throw new KeyNotFoundException($"Session {sessionId} not found");

        if (session.Status != InboundSessionStatus.Draft)
            throw new InvalidOperationException("Can only add items to Draft sessions");

        foreach (var item in request.Items)
        {
            await AddItemToSession(session, item);
        }

        RecalculateSessionTotals(session);
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetSessionByIdAsync(sessionId)
            ?? throw new InvalidOperationException("Session not found after update");
    }

    // =====================================================
    // UPDATE / REMOVE DETAIL
    // =====================================================

    public async Task<InboundSessionDto> UpdateDetailAsync(
        Guid sessionId, Guid detailId, UpdateInboundDetailRequest request)
    {
        var session = await _context.InboundSessions
            .Include(s => s.Receipts).ThenInclude(r => r.Details)
            .FirstOrDefaultAsync(s => s.Id == sessionId)
            ?? throw new KeyNotFoundException($"Session {sessionId} not found");

        if (session.Status != InboundSessionStatus.Draft)
            throw new InvalidOperationException("Can only modify Draft sessions");

        var detail = session.Receipts
            .SelectMany(r => r.Details)
            .FirstOrDefault(d => d.Id == detailId)
            ?? throw new KeyNotFoundException($"Detail {detailId} not found in session");

        if (request.Quantity.HasValue) detail.Quantity = request.Quantity.Value;
        if (request.UnitPrice.HasValue) detail.UnitPrice = request.UnitPrice.Value;
        if (request.Unit != null) detail.Unit = request.Unit;
        if (request.BatchNumber != null) detail.BatchNumber = request.BatchNumber;
        if (request.ExpiryDate.HasValue) detail.ExpiryDate = request.ExpiryDate.Value;
        if (request.ManufactureDate.HasValue) detail.ManufactureDate = request.ManufactureDate.Value;
        if (request.Note != null) detail.Note = request.Note;

        detail.LineTotal = detail.Quantity * detail.UnitPrice;
        detail.UpdatedAt = DateTime.UtcNow;

        // Recalculate receipt totals
        var receipt = session.Receipts.First(r => r.Details.Any(d => d.Id == detailId));
        RecalculateReceiptTotals(receipt);
        RecalculateSessionTotals(session);

        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetSessionByIdAsync(sessionId)
            ?? throw new InvalidOperationException("Session not found after update");
    }

    public async Task<InboundSessionDto> RemoveDetailAsync(Guid sessionId, Guid detailId)
    {
        var session = await _context.InboundSessions
            .Include(s => s.Receipts).ThenInclude(r => r.Details)
            .FirstOrDefaultAsync(s => s.Id == sessionId)
            ?? throw new KeyNotFoundException($"Session {sessionId} not found");

        if (session.Status != InboundSessionStatus.Draft)
            throw new InvalidOperationException("Can only modify Draft sessions");

        InboundReceipt? targetReceipt = null;
        InboundReceiptDetail? targetDetail = null;

        foreach (var receipt in session.Receipts)
        {
            targetDetail = receipt.Details.FirstOrDefault(d => d.Id == detailId);
            if (targetDetail != null)
            {
                targetReceipt = receipt;
                break;
            }
        }

        if (targetDetail == null || targetReceipt == null)
            throw new KeyNotFoundException($"Detail {detailId} not found in session");

        _context.InboundReceiptDetails.Remove(targetDetail);

        // If receipt has no more details, remove the receipt too
        if (targetReceipt.Details.Count <= 1)
        {
            _context.InboundReceipts.Remove(targetReceipt);
        }
        else
        {
            targetReceipt.Details.Remove(targetDetail);
            RecalculateReceiptTotals(targetReceipt);
        }

        RecalculateSessionTotals(session);
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetSessionByIdAsync(sessionId)
            ?? throw new InvalidOperationException("Session not found after update");
    }

    // =====================================================
    // WORKFLOW: Complete / Cancel
    // =====================================================

    public async Task<InboundSessionDto> CompleteSessionAsync(
        Guid sessionId, CompleteInboundSessionRequest request, Guid staffId)
    {
        var session = await _context.InboundSessions
            .Include(s => s.Receipts).ThenInclude(r => r.Details)
            .FirstOrDefaultAsync(s => s.Id == sessionId)
            ?? throw new KeyNotFoundException($"Session {sessionId} not found");

        if (session.Status != InboundSessionStatus.Draft && session.Status != InboundSessionStatus.Processing)
            throw new InvalidOperationException("Session must be Draft or Processing to complete");

        if (!session.Receipts.Any() || !session.Receipts.SelectMany(r => r.Details).Any())
            throw new InvalidOperationException("Cannot complete a session with no items");

        // Mark all receipts as Completed
        foreach (var receipt in session.Receipts)
        {
            receipt.Status = InboundReceiptStatus.Completed;
            receipt.ConfirmedAt = DateTime.UtcNow;
            receipt.UpdatedAt = DateTime.UtcNow;
        }

        session.Status = InboundSessionStatus.Completed;
        session.ApprovedBy = staffId;
        session.CompletedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(request.Note))
            session.Note = (session.Note ?? "") + "\n[Hoàn thành] " + request.Note;

        // Add to warehouse inventory
        await AddToInventory(session);

        await _context.SaveChangesAsync();

        return await GetSessionByIdAsync(sessionId)
            ?? throw new InvalidOperationException("Session not found after completion");
    }

    public async Task<InboundSessionDto> CancelSessionAsync(Guid sessionId, Guid staffId)
    {
        var session = await _context.InboundSessions
            .Include(s => s.Receipts)
            .FirstOrDefaultAsync(s => s.Id == sessionId)
            ?? throw new KeyNotFoundException($"Session {sessionId} not found");

        if (session.Status == InboundSessionStatus.Completed)
            throw new InvalidOperationException("Cannot cancel a completed session");

        foreach (var receipt in session.Receipts)
        {
            receipt.Status = InboundReceiptStatus.Cancelled;
            receipt.UpdatedAt = DateTime.UtcNow;
        }

        session.Status = InboundSessionStatus.Cancelled;
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetSessionByIdAsync(sessionId)
            ?? throw new InvalidOperationException("Session not found after cancellation");
    }

    // =====================================================
    // PRIVATE HELPERS
    // =====================================================

    /// <summary>
    /// Core auto-grouping logic: finds or creates a receipt for the item's supplier,
    /// then adds the detail line.
    /// </summary>
    private async Task AddItemToSession(InboundSession session, AddInboundItemRequest request)
    {
        // Resolve product
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId)
            ?? throw new KeyNotFoundException($"Product {request.ProductId} not found");

        // Resolve supplier: explicit > product default
        int supplierId;
        if (request.SupplierId.HasValue)
        {
            supplierId = request.SupplierId.Value;
        }
        else if (product.SupplierId.HasValue)
        {
            supplierId = product.SupplierId.Value;
        }
        else
        {
            throw new InvalidOperationException(
                $"Product '{product.Name}' has no supplier. Please specify SupplierId.");
        }

        // Verify supplier exists
        var supplier = await _context.Suppliers
            .FirstOrDefaultAsync(s => s.Id == supplierId)
            ?? throw new KeyNotFoundException($"Supplier {supplierId} not found");

        // Find or create receipt for this supplier
        var receipt = session.Receipts.FirstOrDefault(r => r.SupplierId == supplierId);
        if (receipt == null)
        {
            receipt = new InboundReceipt
            {
                Id = Guid.NewGuid(),
                ReceiptCode = await GenerateReceiptCode(),
                SessionId = session.Id,
                SupplierId = supplierId,
                SupplierName = supplier.StoreName,
                Status = InboundReceiptStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            session.Receipts.Add(receipt);
            _context.InboundReceipts.Add(receipt);
        }

        // Add detail line
        var unitPrice = request.UnitPrice > 0 ? request.UnitPrice : product.BasePrice;
        var detail = new InboundReceiptDetail
        {
            Id = Guid.NewGuid(),
            ReceiptId = receipt.Id,
            ProductId = product.Id,
            ProductName = product.Name,
            Quantity = request.Quantity,
            UnitPrice = unitPrice,
            LineTotal = request.Quantity * unitPrice,
            Unit = request.Unit,
            BatchNumber = request.BatchNumber,
            ExpiryDate = request.ExpiryDate,
            ManufactureDate = request.ManufactureDate,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow
        };

        receipt.Details.Add(detail);
        _context.InboundReceiptDetails.Add(detail);

        RecalculateReceiptTotals(receipt);
    }

    /// <summary>Add completed session items to warehouse inventory</summary>
    private async Task AddToInventory(InboundSession session)
    {
        foreach (var receipt in session.Receipts)
        {
            foreach (var detail in receipt.Details)
            {
                // Check if inventory entry exists for this product + warehouse + batch
                var existing = await _context.WarehouseInventories
                    .FirstOrDefaultAsync(wi =>
                        wi.WarehouseId == session.WarehouseId &&
                        wi.ProductId == detail.ProductId &&
                        wi.BatchNumber == (detail.BatchNumber ?? "DEFAULT"));

                if (existing != null)
                {
                    existing.Quantity += detail.Quantity;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    var inventory = new WarehouseInventory
                    {
                        Id = Guid.NewGuid(),
                        WarehouseId = session.WarehouseId,
                        ProductId = detail.ProductId,
                        SupplierId = receipt.SupplierId,
                        BatchNumber = detail.BatchNumber ?? "DEFAULT",
                        Quantity = detail.Quantity,
                        ReservedQuantity = 0,
                        MinStockLevel = 0,
                        MaxStockLevel = 0,
                        UnitCost = detail.UnitPrice,
                        ExpiryDate = detail.ExpiryDate,
                        ManufactureDate = detail.ManufactureDate,
                        InventoryType = InventoryType.Available,
                        Location = "Khu nhập mới",
                        ReceivedAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.WarehouseInventories.Add(inventory);
                }
            }
        }
    }

    private void RecalculateReceiptTotals(InboundReceipt receipt)
    {
        receipt.TotalItems = receipt.Details.Count;
        receipt.TotalQuantity = receipt.Details.Sum(d => d.Quantity);
        receipt.TotalAmount = receipt.Details.Sum(d => d.LineTotal);
        receipt.UpdatedAt = DateTime.UtcNow;
    }

    private void RecalculateSessionTotals(InboundSession session)
    {
        session.TotalSuppliers = session.Receipts.Count;
        session.TotalItems = session.Receipts.Sum(r => r.TotalItems);
        session.TotalQuantity = session.Receipts.Sum(r => r.TotalQuantity);
        session.TotalAmount = session.Receipts.Sum(r => r.TotalAmount);
    }

    private async Task<string> GenerateSessionCode()
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"IBS-{today}-";
        var count = await _context.InboundSessions
            .Where(s => s.SessionCode.StartsWith(prefix))
            .CountAsync();
        return $"{prefix}{(count + 1):D4}";
    }

    private async Task<string> GenerateReceiptCode()
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"IBR-{today}-";
        var count = await _context.InboundReceipts
            .Where(r => r.ReceiptCode.StartsWith(prefix))
            .CountAsync();
        return $"{prefix}{(count + 1):D4}";
    }

    private IQueryable<InboundSession> GetSessionWithIncludes()
    {
        return _context.InboundSessions
            .Include(s => s.Warehouse)
            .Include(s => s.CreatedByStaff).ThenInclude(st => st.User)
            .Include(s => s.ApprovedByStaff).ThenInclude(st => st!.User)
            .Include(s => s.Receipts).ThenInclude(r => r.Details);
    }

    // =====================================================
    // MAPPING
    // =====================================================

    private static InboundSessionDto MapSessionToDto(InboundSession session) => new()
    {
        Id = session.Id,
        SessionCode = session.SessionCode,
        WarehouseId = session.WarehouseId,
        WarehouseName = session.Warehouse?.Name,
        CreatedBy = session.CreatedBy,
        CreatedByName = session.CreatedByStaff?.User?.FullName,
        ApprovedBy = session.ApprovedBy,
        ApprovedByName = session.ApprovedByStaff?.User?.FullName,
        Status = session.Status.ToString(),
        Note = session.Note,
        TotalSuppliers = session.TotalSuppliers,
        TotalItems = session.TotalItems,
        TotalQuantity = session.TotalQuantity,
        TotalAmount = session.TotalAmount,
        CompletedAt = session.CompletedAt,
        CreatedAt = session.CreatedAt,
        UpdatedAt = session.UpdatedAt,
        Receipts = session.Receipts.Select(MapReceiptToDto).ToList()
    };

    private static InboundReceiptDto MapReceiptToDto(InboundReceipt receipt) => new()
    {
        Id = receipt.Id,
        ReceiptCode = receipt.ReceiptCode,
        SessionId = receipt.SessionId,
        SupplierId = receipt.SupplierId,
        SupplierName = receipt.SupplierName,
        Status = receipt.Status.ToString(),
        TotalItems = receipt.TotalItems,
        TotalQuantity = receipt.TotalQuantity,
        TotalAmount = receipt.TotalAmount,
        Note = receipt.Note,
        ConfirmedAt = receipt.ConfirmedAt,
        CreatedAt = receipt.CreatedAt,
        Details = receipt.Details.Select(MapDetailToDto).ToList()
    };

    private static InboundReceiptDetailDto MapDetailToDto(InboundReceiptDetail detail) => new()
    {
        Id = detail.Id,
        ReceiptId = detail.ReceiptId,
        ProductId = detail.ProductId,
        ProductName = detail.ProductName,
        Quantity = detail.Quantity,
        UnitPrice = detail.UnitPrice,
        LineTotal = detail.LineTotal,
        Unit = detail.Unit,
        BatchNumber = detail.BatchNumber,
        ExpiryDate = detail.ExpiryDate,
        ManufactureDate = detail.ManufactureDate,
        Note = detail.Note,
        CreatedAt = detail.CreatedAt
    };
}
