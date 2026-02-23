using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.Staff;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces.StaffModule;

namespace FoodCare.API.Services.Implementations.StaffModule;

public class DiscrepancyService : IDiscrepancyService
{
    private readonly FoodCareDbContext _context;

    public DiscrepancyService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<DiscrepancyReportDto>> GetDiscrepanciesAsync(
        int page, int pageSize, Guid? receiptId, string? status, Guid? warehouseId = null)
    {
        var query = _context.DiscrepancyReports
            .Include(d => d.Shipment)
            .Include(d => d.Receipt)
            .Include(d => d.Supplier)
            .Include(d => d.ReportedByStaff)
                .ThenInclude(s => s.User)
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .AsQueryable();

        if (warehouseId.HasValue)
            query = query.Where(d => d.Shipment.WarehouseId == warehouseId.Value);

        if (receiptId.HasValue)
            query = query.Where(d => d.ReceiptId == receiptId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(d => d.Status == status);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<DiscrepancyReportDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<DiscrepancyReportDto?> GetDiscrepancyByIdAsync(Guid id)
    {
        var discrepancy = await _context.DiscrepancyReports
            .Include(d => d.Shipment)
            .Include(d => d.Receipt)
            .Include(d => d.Supplier)
            .Include(d => d.ReportedByStaff)
                .ThenInclude(s => s.User)
            .Include(d => d.ResolvedByUser)
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(d => d.Id == id);

        return discrepancy != null ? MapToDto(discrepancy) : null;
    }

    public async Task<IEnumerable<DiscrepancyReportDto>> GetDiscrepanciesByReceiptAsync(Guid receiptId)
    {
        var discrepancies = await _context.DiscrepancyReports
            .Include(d => d.Shipment)
            .Include(d => d.Items)
                .ThenInclude(i => i.Product)
            .Where(d => d.ReceiptId == receiptId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return discrepancies.Select(MapToDto);
    }

    public async Task<DiscrepancyReportDto> CreateDiscrepancyAsync(CreateDiscrepancyReportRequest request, Guid staffId)
    {
        var shipment = await _context.SupplierShipments.FindAsync(request.ShipmentId);
        if (shipment == null)
            throw new ArgumentException("Shipment not found");

        if (!Enum.TryParse<DiscrepancyType>(request.DiscrepancyType, true, out var discrepancyType))
            throw new ArgumentException($"Invalid discrepancy type: {request.DiscrepancyType}");

        var discrepancy = new DiscrepancyReport
        {
            Id = Guid.NewGuid(),
            ReportNumber = await GenerateReportNumberAsync(),
            ShipmentId = request.ShipmentId,
            ReceiptId = request.ReceiptId,
            SupplierId = shipment.SupplierId,
            DiscrepancyType = discrepancyType,
            Status = "draft",
            Description = request.Description,
            AffectedQuantity = request.Items.Sum(i => Math.Abs(i.ExpectedQuantity - i.ActualQuantity)),
            ReportedBy = staffId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var itemRequest in request.Items)
        {
            if (!Enum.TryParse<DiscrepancyType>(itemRequest.DiscrepancyType, true, out var itemDiscrepancyType))
                throw new ArgumentException($"Invalid discrepancy type for item: {itemRequest.DiscrepancyType}");
                
            discrepancy.Items.Add(new DiscrepancyItem
            {
                Id = Guid.NewGuid(),
                DiscrepancyReportId = discrepancy.Id,
                ProductId = itemRequest.ProductId,
                ShipmentItemId = itemRequest.ShipmentItemId,
                DiscrepancyType = itemDiscrepancyType,
                ExpectedQuantity = itemRequest.ExpectedQuantity,
                ActualQuantity = itemRequest.ActualQuantity,
                DiscrepancyQuantity = Math.Abs(itemRequest.ExpectedQuantity - itemRequest.ActualQuantity),
                BatchNumber = itemRequest.BatchNumber,
                Description = itemRequest.Description,
                EvidenceUrls = string.Join(",", itemRequest.EvidenceUrls ?? new List<string>()),
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.DiscrepancyReports.Add(discrepancy);
        await _context.SaveChangesAsync();

        return await GetDiscrepancyByIdAsync(discrepancy.Id) ?? throw new InvalidOperationException();
    }

    public async Task<DiscrepancyReportDto?> AddDiscrepancyItemAsync(Guid reportId, AddDiscrepancyItemRequest request)
    {
        var report = await _context.DiscrepancyReports
            .Include(d => d.Items)
            .FirstOrDefaultAsync(d => d.Id == reportId);

        if (report == null) return null;

        if (report.Status != "draft")
            throw new InvalidOperationException("Cannot add items to non-draft report");

        if (!Enum.TryParse<DiscrepancyType>(request.DiscrepancyType, true, out var discrepancyType))
            throw new ArgumentException($"Invalid discrepancy type: {request.DiscrepancyType}");

        report.Items.Add(new DiscrepancyItem
        {
            Id = Guid.NewGuid(),
            DiscrepancyReportId = reportId,
            ProductId = request.ProductId,
            ShipmentItemId = request.ShipmentItemId,
            DiscrepancyType = discrepancyType,
            ExpectedQuantity = request.ExpectedQuantity,
            ActualQuantity = request.ActualQuantity,
            DiscrepancyQuantity = Math.Abs(request.ExpectedQuantity - request.ActualQuantity),
            BatchNumber = request.BatchNumber,
            Description = request.Description,
            EvidenceUrls = string.Join(",", request.EvidenceUrls ?? new List<string>()),
            CreatedAt = DateTime.UtcNow
        });

        report.AffectedQuantity = report.Items.Sum(i => i.DiscrepancyQuantity);
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetDiscrepancyByIdAsync(reportId);
    }

    public async Task<DiscrepancyReportDto?> UpdateDiscrepancyItemAsync(Guid reportId, Guid itemId, UpdateDiscrepancyItemRequest request)
    {
        var report = await _context.DiscrepancyReports
            .Include(d => d.Items)
            .FirstOrDefaultAsync(d => d.Id == reportId);

        if (report == null) return null;

        if (report.Status != "draft")
            throw new InvalidOperationException("Cannot update items in non-draft report");

        var item = report.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return null;

        if (request.ExpectedQuantity.HasValue)
            item.ExpectedQuantity = request.ExpectedQuantity.Value;
        if (request.ActualQuantity.HasValue)
            item.ActualQuantity = request.ActualQuantity.Value;
        if (request.Description != null)
            item.Description = request.Description;
        if (request.EvidenceUrls != null)
            item.EvidenceUrls = string.Join(",", request.EvidenceUrls);

        item.DiscrepancyQuantity = Math.Abs(item.ExpectedQuantity - item.ActualQuantity);

        report.AffectedQuantity = report.Items.Sum(i => i.DiscrepancyQuantity);
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetDiscrepancyByIdAsync(reportId);
    }

    public async Task<DiscrepancyReportDto?> SubmitDiscrepancyAsync(Guid id)
    {
        var report = await _context.DiscrepancyReports.FindAsync(id);
        if (report == null) return null;

        if (report.Status != "draft")
            throw new InvalidOperationException("Only draft reports can be submitted");

        report.Status = "pending_review";
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetDiscrepancyByIdAsync(id);
    }

    public async Task<DiscrepancyReportDto?> ApproveDiscrepancyAsync(Guid id, ApproveDiscrepancyRequest request, Guid staffId)
    {
        var report = await _context.DiscrepancyReports.FindAsync(id);
        if (report == null) return null;

        if (report.Status != "pending_review")
            throw new InvalidOperationException("Only pending reports can be approved");

        report.Status = "approved";
        report.ResolutionNotes = request.ApprovalNotes;
        report.UpdatedAt = DateTime.UtcNow;

        // Notify supplier
        report.SupplierNotifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetDiscrepancyByIdAsync(id);
    }

    public async Task<DiscrepancyReportDto?> RejectDiscrepancyAsync(Guid id, RejectDiscrepancyRequest request, Guid staffId)
    {
        var report = await _context.DiscrepancyReports.FindAsync(id);
        if (report == null) return null;

        if (report.Status != "pending_review")
            throw new InvalidOperationException("Only pending reports can be rejected");

        report.Status = "rejected";
        report.ResolutionNotes = request.RejectionReason;
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetDiscrepancyByIdAsync(id);
    }

    public async Task<DiscrepancyReportDto?> ResolveDiscrepancyAsync(Guid id, ResolveDiscrepancyRequest request, Guid staffId)
    {
        var report = await _context.DiscrepancyReports.FindAsync(id);
        if (report == null) return null;

        if (report.Status != "approved")
            throw new InvalidOperationException("Only approved reports can be resolved");

        report.Status = "resolved";
        report.ResolutionType = request.ResolutionType;
        report.ResolutionNotes = request.ResolutionNotes;
        report.ResolvedBy = staffId;
        report.ResolvedAt = DateTime.UtcNow;
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetDiscrepancyByIdAsync(id);
    }

    public async Task<object> GetDiscrepancyStatsAsync(Guid? warehouseId = null)
    {
        var baseQuery = _context.DiscrepancyReports.AsQueryable();
        if (warehouseId.HasValue)
            baseQuery = baseQuery.Where(d => d.Shipment.WarehouseId == warehouseId.Value);

        var stats = await baseQuery
            .GroupBy(d => d.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var recent = await baseQuery
            .Where(d => d.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .CountAsync();

        return new
        {
            StatusCounts = stats.ToDictionary(s => s.Status, s => s.Count),
            RecentCount = recent,
            PendingCount = stats.FirstOrDefault(s => s.Status == "pending_review")?.Count ?? 0
        };
    }

    private async Task<string> GenerateReportNumberAsync()
    {
        var today = DateTime.UtcNow;
        var prefix = $"DIS-{today:yyyyMMdd}-";

        var lastReport = await _context.DiscrepancyReports
            .Where(d => d.ReportNumber.StartsWith(prefix))
            .OrderByDescending(d => d.ReportNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastReport != null)
        {
            var lastNumberStr = lastReport.ReportNumber.Substring(prefix.Length);
            if (int.TryParse(lastNumberStr, out var lastNumber))
                nextNumber = lastNumber + 1;
        }

        return $"{prefix}{nextNumber:D4}";
    }

    private DiscrepancyReportDto MapToDto(DiscrepancyReport report)
    {
        return new DiscrepancyReportDto
        {
            Id = report.Id,
            ReportNumber = report.ReportNumber,
            ShipmentId = report.ShipmentId,
            ShipmentReference = report.Shipment?.ExternalReference,
            ReceiptId = report.ReceiptId,
            ReceiptNumber = report.Receipt?.ReceiptNumber,
            SupplierId = report.SupplierId,
            SupplierName = report.Supplier?.BusinessName ?? report.Supplier?.StoreName,
            DiscrepancyType = report.DiscrepancyType.ToString(),
            Status = report.Status,
            Description = report.Description,
            AffectedQuantity = report.AffectedQuantity,
            AffectedValue = report.AffectedValue,
            SupplierNotifiedAt = report.SupplierNotifiedAt,
            SupplierResponse = report.SupplierResponse,
            SupplierResponseAt = report.SupplierResponseAt,
            ResolutionType = report.ResolutionType,
            ResolutionNotes = report.ResolutionNotes,
            ResolvedAt = report.ResolvedAt,
            ResolvedByName = report.ResolvedByUser?.FullName,
            ReportedByName = report.ReportedByStaff?.User?.FullName,
            CreatedAt = report.CreatedAt,
            Items = report.Items.Select(i => new DiscrepancyItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                DiscrepancyType = i.DiscrepancyType.ToString(),
                ExpectedQuantity = i.ExpectedQuantity,
                ActualQuantity = i.ActualQuantity,
                DiscrepancyQuantity = i.DiscrepancyQuantity,
                BatchNumber = i.BatchNumber,
                Description = i.Description,
                EvidenceUrls = !string.IsNullOrEmpty(i.EvidenceUrls) ? i.EvidenceUrls.Split(',').ToList() : new List<string>()
            }).ToList()
        };
    }
}
