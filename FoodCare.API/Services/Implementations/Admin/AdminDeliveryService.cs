using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminDeliveryService : IAdminDeliveryService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<AdminDeliveryService> _logger;

    public AdminDeliveryService(FoodCareDbContext context, ILogger<AdminDeliveryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResponse<AdminDeliverySummaryDto>> GetAllDeliveriesAsync(DeliveryFilterDto filter)
    {
        var query = _context.SupplierShipments
            .Include(s => s.Supplier)
            .Include(s => s.Warehouse)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Status) && Enum.TryParse<ShipmentStatus>(filter.Status, out var statusEnum))
            query = query.Where(s => s.Status == statusEnum);

        if (filter.SupplierId.HasValue)
            query = query.Where(s => s.SupplierId == filter.SupplierId.Value);

        if (filter.WarehouseId.HasValue)
            query = query.Where(s => s.WarehouseId == filter.WarehouseId.Value);

        if (filter.DateFrom.HasValue)
            query = query.Where(s => s.CreatedAt >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(s => s.CreatedAt <= filter.DateTo.Value);

        if (!string.IsNullOrEmpty(filter.Search))
            query = query.Where(s => s.ExternalReference.Contains(filter.Search) ||
                                     (s.Supplier != null && s.Supplier.StoreName != null && s.Supplier.StoreName.Contains(filter.Search)));

        var totalCount = await query.CountAsync();

        query = filter.SortBy?.ToLower() switch
        {
            "supplier" => filter.SortDescending ? query.OrderByDescending(s => s.Supplier!.StoreName) : query.OrderBy(s => s.Supplier!.StoreName),
            "status" => filter.SortDescending ? query.OrderByDescending(s => s.Status) : query.OrderBy(s => s.Status),
            "value" => filter.SortDescending ? query.OrderByDescending(s => s.TotalValue) : query.OrderBy(s => s.TotalValue),
            _ => filter.SortDescending ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt)
        };

        var shipments = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResponse<AdminDeliverySummaryDto>
        {
            Items = shipments.Select(MapToSummaryDto).ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<PagedResponse<AdminDeliverySummaryDto>> GetPendingDeliveriesAsync(int page, int pageSize)
    {
        var query = _context.SupplierShipments
            .Include(s => s.Supplier)
            .Include(s => s.Warehouse)
            .Where(s => s.Status == ShipmentStatus.Delivering);

        var totalCount = await query.CountAsync();

        var shipments = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<AdminDeliverySummaryDto>
        {
            Items = shipments.Select(MapToSummaryDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminDeliveryDetailDto?> GetDeliveryDetailAsync(Guid shipmentId)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Supplier)
            .Include(s => s.Warehouse)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .Include(s => s.Documents)
            .Include(s => s.StatusHistory).ThenInclude(h => h.ChangedByUser)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

        if (shipment == null) return null;

        return MapToDetailDto(shipment);
    }

    public async Task<bool> DeleteShipmentAsync(Guid shipmentId)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .Include(s => s.Documents)
            .Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

        if (shipment == null) return false;

        _context.ShipmentStatusHistories.RemoveRange(shipment.StatusHistory);
        _context.ShipmentDocuments.RemoveRange(shipment.Documents);
        _context.ShipmentItems.RemoveRange(shipment.Items);
        _context.SupplierShipments.Remove(shipment);

        await _context.SaveChangesAsync();
        _logger.LogInformation("Admin deleted shipment {ShipmentId}", shipmentId);
        return true;
    }

    public async Task<bool> DeleteInboundSessionAsync(Guid sessionId)
    {
        var session = await _context.InboundSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return false;

        // Delete related shipments
        var shipments = await _context.SupplierShipments
            .Include(s => s.Items)
            .Include(s => s.Documents)
            .Include(s => s.StatusHistory)
            .Where(s => s.InboundSessionId == sessionId)
            .ToListAsync();

        foreach (var shipment in shipments)
        {
            _context.ShipmentStatusHistories.RemoveRange(shipment.StatusHistory);
            _context.ShipmentDocuments.RemoveRange(shipment.Documents);
            _context.ShipmentItems.RemoveRange(shipment.Items);
        }
        _context.SupplierShipments.RemoveRange(shipments);

        // Delete inbound receipts and details
        var receipts = await _context.InboundReceipts
            .Include(r => r.Details)
            .Where(r => r.SessionId == sessionId)
            .ToListAsync();

        foreach (var receipt in receipts)
            _context.InboundReceiptDetails.RemoveRange(receipt.Details);
        _context.InboundReceipts.RemoveRange(receipts);

        // Delete session suppliers
        var sessionSuppliers = await _context.InboundSessionSuppliers
            .Where(ss => ss.SessionId == sessionId)
            .ToListAsync();
        _context.InboundSessionSuppliers.RemoveRange(sessionSuppliers);

        _context.InboundSessions.Remove(session);

        await _context.SaveChangesAsync();
        _logger.LogInformation("Admin deleted inbound session {SessionId}", sessionId);
        return true;
    }

    public async Task<PagedResponse<AdminActionLogDto>> GetAuditLogAsync(AuditLogFilterDto filter)
    {
        var query = _context.AdminActionLogs.AsQueryable();

        if (filter.ShipmentId.HasValue)
            query = query.Where(l => l.EntityId == filter.ShipmentId.Value.ToString());

        if (filter.AdminId.HasValue)
            query = query.Where(l => l.AdminId == filter.AdminId.Value);

        if (!string.IsNullOrEmpty(filter.EntityType))
            query = query.Where(l => l.EntityType == filter.EntityType);

        if (!string.IsNullOrEmpty(filter.Action))
            query = query.Where(l => l.Action == filter.Action);

        if (filter.DateFrom.HasValue)
            query = query.Where(l => l.CreatedAt >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(l => l.CreatedAt <= filter.DateTo.Value);

        var totalCount = await query.CountAsync();

        var logs = await query
            .Include(l => l.Admin)
            .OrderByDescending(l => l.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResponse<AdminActionLogDto>
        {
            Items = logs.Select(l => new AdminActionLogDto
            {
                Id = l.Id,
                EntityType = l.EntityType,
                EntityId = l.EntityId,
                AdminId = l.AdminId,
                AdminName = l.Admin?.FullName,
                Action = l.Action,
                OldStatus = l.OldStatus,
                NewStatus = l.NewStatus,
                Reason = l.Reason,
                Metadata = l.Metadata,
                CreatedAt = l.CreatedAt
            }).ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<DeliveryKpiDto> GetDeliveryKpiAsync(Guid warehouseId, DateTime? from, DateTime? to)
    {
        var query = _context.SupplierShipments.Where(s => s.WarehouseId == warehouseId);
        if (from.HasValue) query = query.Where(s => s.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(s => s.CreatedAt <= to.Value);

        var warehouse = await _context.Warehouses.FindAsync(warehouseId);
        var shipments = await query.ToListAsync();

        return ComputeKpi(shipments, warehouseId, warehouse?.Name, from, to);
    }

    public async Task<List<DeliveryKpiDto>> GetAllWarehouseKpisAsync(DateTime? from, DateTime? to)
    {
        var query = _context.SupplierShipments.AsQueryable();
        if (from.HasValue) query = query.Where(s => s.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(s => s.CreatedAt <= to.Value);

        var shipments = await query.ToListAsync();
        var warehouses = await _context.Warehouses.ToListAsync();

        return shipments
            .GroupBy(s => s.WarehouseId)
            .Select(g =>
            {
                var wh = warehouses.FirstOrDefault(w => w.Id == g.Key);
                return ComputeKpi(g.ToList(), g.Key, wh?.Name, from, to);
            })
            .ToList();
    }

    private static DeliveryKpiDto ComputeKpi(List<Models.Staff.SupplierShipment> shipments, Guid? warehouseId, string? warehouseName, DateTime? from, DateTime? to)
    {
        var total = shipments.Count;
        var completed = shipments.Count(s => s.Status == ShipmentStatus.Success);
        var cancelled = shipments.Count(s => s.Status == ShipmentStatus.Cancelled);
        var inProgress = shipments.Count(s => s.Status == ShipmentStatus.Delivering || s.Status == ShipmentStatus.Received);
        var preparing = shipments.Count(s => s.Status == ShipmentStatus.Preparing);

        var onTime = shipments.Count(s => s.ActualArrivalDate.HasValue && s.ActualArrivalDate <= s.ExpectedDeliveryDate);
        var onTimeRate = total > 0 ? (double)onTime / total * 100 : 0;

        return new DeliveryKpiDto
        {
            WarehouseId = warehouseId,
            WarehouseName = warehouseName,
            TotalDeliveries = total,
            CompletedCount = completed,
            CancelledCount = cancelled,
            InProgressCount = inProgress,
            ApprovedCount = preparing,
            RejectedCount = 0,
            DisputedCount = 0,
            OnHoldCount = 0,
            OnTimeDeliveryRate = onTimeRate,
            AvgApprovalTimeMinutes = 0,
            SupplierComplianceRate = total > 0 ? (double)completed / total * 100 : 0,
            RejectRate = 0,
            DisputeRate = 0,
            PeriodFrom = from,
            PeriodTo = to
        };
    }

    private static AdminDeliverySummaryDto MapToSummaryDto(Models.Staff.SupplierShipment s)
    {
        return new AdminDeliverySummaryDto
        {
            Id = s.Id,
            ExternalReference = s.ExternalReference ?? "",
            SupplierId = s.SupplierId,
            SupplierName = s.Supplier?.StoreName ?? s.Supplier?.BusinessName ?? "",
            WarehouseId = s.WarehouseId,
            WarehouseName = s.Warehouse?.Name ?? "",
            Status = s.Status.ToString(),
            ExpectedDeliveryDate = s.ExpectedDeliveryDate,
            TotalValue = s.TotalValue,
            TotalItems = s.TotalItems,
            TotalQuantity = s.TotalQuantity,
            CreatedAt = s.CreatedAt
        };
    }

    private static AdminDeliveryDetailDto MapToDetailDto(Models.Staff.SupplierShipment s)
    {
        return new AdminDeliveryDetailDto
        {
            Id = s.Id,
            ExternalReference = s.ExternalReference ?? "",
            SupplierId = s.SupplierId,
            SupplierName = s.Supplier?.BusinessName ?? "",
            SupplierStoreName = s.Supplier?.StoreName,
            SupplierIsVerified = s.Supplier?.IsVerified ?? false,
            WarehouseId = s.WarehouseId,
            WarehouseName = s.Warehouse?.Name ?? "",
            WarehouseCode = s.Warehouse?.Code,
            Status = s.Status.ToString(),
            ExpectedDeliveryDate = s.ExpectedDeliveryDate,
            ActualDispatchDate = s.ActualDispatchDate,
            ActualArrivalDate = s.ActualArrivalDate,
            TrackingNumber = s.TrackingNumber,
            Carrier = s.Carrier,
            Notes = s.Notes,
            TotalValue = s.TotalValue,
            TotalItems = s.TotalItems,
            TotalQuantity = s.TotalQuantity,
            CreatedAt = s.CreatedAt,
            Items = s.Items.Select(i => new AdminDeliveryItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                ProductSku = i.Product?.Sku,
                ExpectedQuantity = i.ExpectedQuantity,
                ReceivedQuantity = i.ReceivedQuantity,
                DamagedQuantity = i.DamagedQuantity,
                Uom = "unit",
                BatchNumber = i.BatchNumber,
                ExpiryDate = i.ExpiryDate,
                UnitCost = i.UnitCost,
                LineTotal = (i.UnitCost ?? 0) * i.ExpectedQuantity
            }).ToList(),
            Documents = s.Documents.Select(d => new AdminDeliveryDocumentDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType ?? "",
                FileName = d.FileName ?? "",
                FileUrl = d.FileUrl ?? "",
                MimeType = d.MimeType,
                FileSize = d.FileSize,
                UploadedAt = d.UploadedAt
            }).ToList(),
            StatusHistory = s.StatusHistory
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new AdminDeliveryStatusHistoryDto
                {
                    Id = h.Id,
                    PreviousStatus = h.PreviousStatus?.ToString(),
                    NewStatus = h.NewStatus.ToString(),
                    Notes = h.Notes,
                    Location = h.Location,
                    ChangedBy = h.ChangedBy,
                    ChangedByName = h.ChangedByUser?.FullName,
                    CreatedAt = h.CreatedAt
                }).ToList()
        };
    }
}
