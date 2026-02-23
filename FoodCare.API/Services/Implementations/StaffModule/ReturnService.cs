using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.Staff;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;

namespace FoodCare.API.Services.Implementations.StaffModule;

public class ReturnService : IReturnService
{
    private readonly FoodCareDbContext _context;

    public ReturnService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<ReturnShipmentDto>> GetReturnsAsync(
        int page, int pageSize, Guid? supplierId, string? status, Guid? warehouseId = null)
    {
        var query = _context.ReturnShipments
            .Include(r => r.OriginalShipment)
            .Include(r => r.Supplier)
            .Include(r => r.Warehouse)
            .Include(r => r.Creator)
            .Include(r => r.Items)
                .ThenInclude(i => i.Product)
            .AsQueryable();

        if (warehouseId.HasValue)
            query = query.Where(r => r.WarehouseId == warehouseId.Value);

        if (supplierId.HasValue)
        {
            var supplierIdInt = (int)supplierId.Value.GetHashCode(); // Note: Might need proper conversion
            query = query.Where(r => r.SupplierId == supplierIdInt);
        }

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<ReturnShipmentDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReturnShipmentDto?> GetReturnByIdAsync(Guid id)
    {
        var returnShipment = await _context.ReturnShipments
            .Include(r => r.OriginalShipment)
            .Include(r => r.Supplier)
            .Include(r => r.Warehouse)
            .Include(r => r.Creator)
            .Include(r => r.Approver)
            .Include(r => r.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(r => r.Id == id);

        return returnShipment != null ? MapToDto(returnShipment) : null;
    }

    public async Task<IEnumerable<ReturnShipmentDto>> GetReturnsByDiscrepancyAsync(Guid discrepancyId)
    {
        var returns = await _context.ReturnShipments
            .Include(r => r.OriginalShipment)
            .Include(r => r.Items)
                .ThenInclude(i => i.Product)
            .Where(r => r.DiscrepancyReportId == discrepancyId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return returns.Select(MapToDto);
    }

    public async Task<ReturnShipmentDto> CreateReturnAsync(CreateReturnShipmentRequest request, Guid staffId)
    {
        var shipment = await _context.SupplierShipments.FindAsync(request.OriginalShipmentId);
        if (shipment == null)
            throw new ArgumentException("Original shipment not found");

        var returnShipment = new ReturnShipment
        {
            Id = Guid.NewGuid(),
            ReturnNumber = await GenerateReturnNumberAsync(),
            OriginalShipmentId = request.OriginalShipmentId,
            DiscrepancyReportId = request.DiscrepancyReportId,
            SupplierId = shipment.SupplierId,
            WarehouseId = shipment.WarehouseId,
            Status = "draft",
            ReturnReason = request.ReturnReason,
            Description = request.Description,
            TotalItems = request.Items.Count,
            TotalQuantity = request.Items.Sum(i => i.Quantity),
            CreatedBy = staffId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        decimal totalValue = 0;
        foreach (var itemRequest in request.Items)
        {
            var lineTotal = itemRequest.UnitCost.HasValue 
                ? itemRequest.UnitCost.Value * itemRequest.Quantity 
                : 0;
            totalValue += lineTotal;

            returnShipment.Items.Add(new ReturnItem
            {
                Id = Guid.NewGuid(),
                ReturnShipmentId = returnShipment.Id,
                ProductId = itemRequest.ProductId,
                ShipmentItemId = itemRequest.ShipmentItemId,
                Quantity = itemRequest.Quantity,
                BatchNumber = itemRequest.BatchNumber,
                ReturnReason = itemRequest.ReturnReason,
                Description = itemRequest.Description,
                UnitCost = itemRequest.UnitCost,
                LineTotal = lineTotal,
                CreatedAt = DateTime.UtcNow
            });
        }

        returnShipment.TotalValue = totalValue;

        _context.ReturnShipments.Add(returnShipment);
        await _context.SaveChangesAsync();

        return await GetReturnByIdAsync(returnShipment.Id) ?? throw new InvalidOperationException();
    }

    public async Task<ReturnShipmentDto?> AddReturnItemAsync(Guid returnId, AddReturnItemRequest request)
    {
        var returnShipment = await _context.ReturnShipments
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == returnId);

        if (returnShipment == null) return null;

        if (returnShipment.Status != "draft")
            throw new InvalidOperationException("Cannot add items to non-draft return");

        var lineTotal = request.UnitCost.HasValue ? request.UnitCost.Value * request.Quantity : 0;

        returnShipment.Items.Add(new ReturnItem
        {
            Id = Guid.NewGuid(),
            ReturnShipmentId = returnId,
            ProductId = request.ProductId,
            ShipmentItemId = request.ShipmentItemId,
            Quantity = request.Quantity,
            BatchNumber = request.BatchNumber,
            ReturnReason = request.ReturnReason,
            Description = request.Description,
            UnitCost = request.UnitCost,
            LineTotal = lineTotal,
            CreatedAt = DateTime.UtcNow
        });

        returnShipment.TotalItems = returnShipment.Items.Count;
        returnShipment.TotalQuantity = returnShipment.Items.Sum(i => i.Quantity);
        returnShipment.TotalValue = returnShipment.Items.Sum(i => i.LineTotal ?? 0);
        returnShipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReturnByIdAsync(returnId);
    }

    public async Task<ReturnShipmentDto?> UpdateReturnItemAsync(Guid returnId, Guid itemId, UpdateReturnItemRequest request)
    {
        var returnShipment = await _context.ReturnShipments
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == returnId);

        if (returnShipment == null) return null;

        if (returnShipment.Status != "draft")
            throw new InvalidOperationException("Cannot update items in non-draft return");

        var item = returnShipment.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return null;

        if (request.Quantity.HasValue)
        {
            item.Quantity = request.Quantity.Value;
            item.LineTotal = item.UnitCost.HasValue ? item.UnitCost.Value * item.Quantity : 0;
        }
        if (request.ReturnReason != null)
            item.ReturnReason = request.ReturnReason;
        if (request.Description != null)
            item.Description = request.Description;

        returnShipment.TotalQuantity = returnShipment.Items.Sum(i => i.Quantity);
        returnShipment.TotalValue = returnShipment.Items.Sum(i => i.LineTotal ?? 0);
        returnShipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReturnByIdAsync(returnId);
    }

    public async Task<ReturnShipmentDto?> RemoveReturnItemAsync(Guid returnId, Guid itemId)
    {
        var returnShipment = await _context.ReturnShipments
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == returnId);

        if (returnShipment == null) return null;

        if (returnShipment.Status != "draft")
            throw new InvalidOperationException("Cannot remove items from non-draft return");

        var item = returnShipment.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return null;

        returnShipment.Items.Remove(item);
        returnShipment.TotalItems = returnShipment.Items.Count;
        returnShipment.TotalQuantity = returnShipment.Items.Sum(i => i.Quantity);
        returnShipment.TotalValue = returnShipment.Items.Sum(i => i.LineTotal ?? 0);
        returnShipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReturnByIdAsync(returnId);
    }

    public async Task<ReturnShipmentDto?> SubmitReturnAsync(Guid id)
    {
        var returnShipment = await _context.ReturnShipments.FindAsync(id);
        if (returnShipment == null) return null;

        if (returnShipment.Status != "draft")
            throw new InvalidOperationException("Only draft returns can be submitted");

        returnShipment.Status = "pending_approval";
        returnShipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReturnByIdAsync(id);
    }

    public async Task<ReturnShipmentDto?> DispatchReturnAsync(Guid id, DispatchReturnRequest request, Guid staffId)
    {
        var returnShipment = await _context.ReturnShipments.FindAsync(id);
        if (returnShipment == null) return null;

        if (returnShipment.Status != "approved" && returnShipment.Status != "pending_approval")
            throw new InvalidOperationException("Return must be approved before dispatch");

        returnShipment.Status = "shipped";
        returnShipment.TrackingNumber = request.TrackingNumber;
        returnShipment.Carrier = request.Carrier;
        returnShipment.ShippedAt = DateTime.UtcNow;
        returnShipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReturnByIdAsync(id);
    }

    public async Task<ReturnShipmentDto?> ConfirmReceivedAsync(Guid id, ConfirmReturnReceivedRequest request)
    {
        var returnShipment = await _context.ReturnShipments.FindAsync(id);
        if (returnShipment == null) return null;

        if (returnShipment.Status != "shipped")
            throw new InvalidOperationException("Return must be shipped before confirming receipt");

        returnShipment.Status = "received";
        returnShipment.SupplierReceivedAt = request.ReceivedDate;
        returnShipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReturnByIdAsync(id);
    }

    public async Task<ReturnShipmentDto?> RecordCreditAsync(Guid id, RecordCreditRequest request)
    {
        var returnShipment = await _context.ReturnShipments.FindAsync(id);
        if (returnShipment == null) return null;

        if (returnShipment.Status != "received")
            throw new InvalidOperationException("Return must be received before recording credit");

        returnShipment.CreditStatus = "issued";
        returnShipment.CreditAmount = request.CreditAmount;
        returnShipment.CreditIssuedAt = DateTime.UtcNow;
        returnShipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReturnByIdAsync(id);
    }

    public async Task<ReturnShipmentDto?> CloseReturnAsync(Guid id)
    {
        var returnShipment = await _context.ReturnShipments.FindAsync(id);
        if (returnShipment == null) return null;

        returnShipment.Status = "closed";
        returnShipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReturnByIdAsync(id);
    }

    public async Task<ReturnShipmentDto?> CancelReturnAsync(Guid id, CancelReturnRequest request)
    {
        var returnShipment = await _context.ReturnShipments.FindAsync(id);
        if (returnShipment == null) return null;

        if (returnShipment.Status == "shipped" || returnShipment.Status == "received" || returnShipment.Status == "closed")
            throw new InvalidOperationException("Cannot cancel return in current status");

        returnShipment.Status = "cancelled";
        returnShipment.Description = $"Cancelled: {request.Reason}";
        returnShipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReturnByIdAsync(id);
    }

    public async Task<object> GetReturnStatsAsync(Guid? supplierId, Guid? warehouseId = null)
    {
        var query = _context.ReturnShipments.AsQueryable();

        if (warehouseId.HasValue)
            query = query.Where(r => r.WarehouseId == warehouseId.Value);

        if (supplierId.HasValue)
        {
            var supplierIdInt = (int)supplierId.Value.GetHashCode();
            query = query.Where(r => r.SupplierId == supplierIdInt);
        }

        var stats = await query
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key, Count = g.Count(), TotalValue = g.Sum(r => r.TotalValue ?? 0) })
            .ToListAsync();

        var recent = await query
            .Where(r => r.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .CountAsync();

        return new
        {
            StatusCounts = stats.ToDictionary(s => s.Status, s => new { s.Count, s.TotalValue }),
            RecentCount = recent,
            PendingCount = stats.FirstOrDefault(s => s.Status == "pending_approval")?.Count ?? 0,
            TotalValue = stats.Sum(s => s.TotalValue)
        };
    }

    private async Task<string> GenerateReturnNumberAsync()
    {
        var today = DateTime.UtcNow;
        var prefix = $"RTN-{today:yyyyMMdd}-";

        var lastReturn = await _context.ReturnShipments
            .Where(r => r.ReturnNumber.StartsWith(prefix))
            .OrderByDescending(r => r.ReturnNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastReturn != null)
        {
            var lastNumberStr = lastReturn.ReturnNumber.Substring(prefix.Length);
            if (int.TryParse(lastNumberStr, out var lastNumber))
                nextNumber = lastNumber + 1;
        }

        return $"{prefix}{nextNumber:D4}";
    }

    private ReturnShipmentDto MapToDto(ReturnShipment returnShipment)
    {
        return new ReturnShipmentDto
        {
            Id = returnShipment.Id,
            ReturnNumber = returnShipment.ReturnNumber,
            OriginalShipmentId = returnShipment.OriginalShipmentId,
            OriginalShipmentReference = returnShipment.OriginalShipment?.ExternalReference,
            DiscrepancyReportId = returnShipment.DiscrepancyReportId,
            SupplierId = returnShipment.SupplierId,
            SupplierName = returnShipment.Supplier?.BusinessName ?? returnShipment.Supplier?.StoreName,
            WarehouseId = returnShipment.WarehouseId,
            WarehouseName = returnShipment.Warehouse?.Name,
            Status = returnShipment.Status,
            ReturnReason = returnShipment.ReturnReason,
            Description = returnShipment.Description,
            TotalItems = returnShipment.TotalItems,
            TotalQuantity = returnShipment.TotalQuantity,
            TotalValue = returnShipment.TotalValue,
            TrackingNumber = returnShipment.TrackingNumber,
            Carrier = returnShipment.Carrier,
            ShippedAt = returnShipment.ShippedAt,
            SupplierReceivedAt = returnShipment.SupplierReceivedAt,
            CreditStatus = returnShipment.CreditStatus,
            CreditAmount = returnShipment.CreditAmount,
            CreditIssuedAt = returnShipment.CreditIssuedAt,
            CreatedByName = returnShipment.Creator?.FullName,
            ApprovedByName = returnShipment.Approver?.FullName,
            ApprovedAt = returnShipment.ApprovedAt,
            CreatedAt = returnShipment.CreatedAt,
            Items = returnShipment.Items.Select(i => new ReturnItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                Quantity = i.Quantity,
                BatchNumber = i.BatchNumber,
                ReturnReason = i.ReturnReason,
                Description = i.Description,
                UnitCost = i.UnitCost,
                LineTotal = i.LineTotal
            }).ToList()
        };
    }
}
