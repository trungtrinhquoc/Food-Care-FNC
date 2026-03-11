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

public class ReceiptService : IReceiptService
{
    private readonly FoodCareDbContext _context;
    private readonly IInventoryService _inventoryService;

    public ReceiptService(FoodCareDbContext context, IInventoryService inventoryService)
    {
        _context = context;
        _inventoryService = inventoryService;
    }

    public async Task<PagedResponse<ReceiptDto>> GetReceiptsAsync(
        int page, int pageSize, Guid? warehouseId, string? status)
    {
        var query = _context.Receipts
            .Include(r => r.Warehouse)
            .Include(r => r.Shipment)
            .Include(r => r.ReceivedByStaff)
                .ThenInclude(s => s.User)
            .Include(r => r.Items)
                .ThenInclude(i => i.Product)
            .AsQueryable();

        if (warehouseId.HasValue)
            query = query.Where(r => r.WarehouseId == warehouseId.Value);

        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<ReceiptStatus>(status, true, out var statusEnum))
                query = query.Where(r => r.Status == statusEnum);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<ReceiptDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReceiptDto?> GetReceiptByIdAsync(Guid id)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Warehouse)
            .Include(r => r.Shipment)
            .Include(r => r.ReceivedByStaff)
                .ThenInclude(s => s.User)
            .Include(r => r.InspectedByStaff)
                .ThenInclude(s => s!.User)
            .Include(r => r.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(r => r.Id == id);

        return receipt != null ? MapToDto(receipt) : null;
    }

    public async Task<ReceiptDto?> GetReceiptByShipmentIdAsync(Guid shipmentId)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Warehouse)
            .Include(r => r.Shipment)
            .Include(r => r.ReceivedByStaff)
                .ThenInclude(s => s.User)
            .Include(r => r.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(r => r.ShipmentId == shipmentId);

        return receipt != null ? MapToDto(receipt) : null;
    }

    public async Task<ReceiptDto> CreateReceiptAsync(CreateReceiptRequest request, Guid staffId)
    {
        // Verify shipment exists and is in 'arrived' status
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId);

        if (shipment == null)
            throw new ArgumentException("Shipment not found");

        if (shipment.Status != ShipmentStatus.Received)
            throw new InvalidOperationException("Shipment must be in 'Received' status to create receipt");

        // Check if receipt already exists
        var existingReceipt = await _context.Receipts.AnyAsync(r => r.ShipmentId == request.ShipmentId);
        if (existingReceipt)
            throw new InvalidOperationException("Receipt already exists for this shipment");

        var receipt = new Receipt
        {
            Id = Guid.NewGuid(),
            ReceiptNumber = await GenerateReceiptNumberAsync(),
            ShipmentId = request.ShipmentId,
            WarehouseId = shipment.WarehouseId,
            ReceivedBy = staffId,
            Status = ReceiptStatus.Pending,
            ArrivalDate = request.ArrivalDate,
            TotalExpected = shipment.Items.Sum(i => i.ExpectedQuantity),
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create receipt items from shipment items
        foreach (var shipmentItem in shipment.Items)
        {
            receipt.Items.Add(new ReceiptItem
            {
                Id = Guid.NewGuid(),
                ReceiptId = receipt.Id,
                ShipmentItemId = shipmentItem.Id,
                ProductId = shipmentItem.ProductId,
                ExpectedQuantity = shipmentItem.ExpectedQuantity,
                ReceivedQuantity = 0,
                AcceptedQuantity = 0,
                DamagedQuantity = 0,
                MissingQuantity = 0,
                QuarantineQuantity = 0,
                BatchNumber = shipmentItem.BatchNumber,
                ExpiryDate = shipmentItem.ExpiryDate,
                Status = ReceiptStatus.Pending,
                QcRequired = false, // Can be set based on product/category rules
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        _context.Receipts.Add(receipt);
        await _context.SaveChangesAsync();

        return await GetReceiptByIdAsync(receipt.Id) ?? throw new InvalidOperationException();
    }

    public async Task<ReceiptDto?> StartInspectionAsync(Guid receiptId, Guid staffId)
    {
        var receipt = await _context.Receipts.FindAsync(receiptId);
        if (receipt == null) return null;

        if (receipt.Status != ReceiptStatus.Pending)
            throw new InvalidOperationException("Receipt must be in 'pending' status to start inspection");

        receipt.Status = ReceiptStatus.Inspecting;
        receipt.InspectedBy = staffId;
        receipt.InspectionStart = DateTime.UtcNow;
        receipt.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetReceiptByIdAsync(receiptId);
    }

    public async Task<ReceiptDto?> InspectItemAsync(Guid receiptId, Guid itemId, InspectReceiptItemRequest request)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == receiptId);

        if (receipt == null) return null;

        if (receipt.Status != ReceiptStatus.Inspecting)
            throw new InvalidOperationException("Receipt must be in 'inspecting' status");

        var item = receipt.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return null;

        // Validate quantities
        var totalInspected = request.AcceptedQuantity + request.DamagedQuantity + 
                            request.MissingQuantity + request.QuarantineQuantity;
        if (totalInspected > request.ReceivedQuantity)
            throw new InvalidOperationException("Sum of inspected quantities cannot exceed received quantity");

        item.ReceivedQuantity = request.ReceivedQuantity;
        item.AcceptedQuantity = request.AcceptedQuantity;
        item.DamagedQuantity = request.DamagedQuantity;
        item.MissingQuantity = request.MissingQuantity;
        item.QuarantineQuantity = request.QuarantineQuantity;
        
        if (!string.IsNullOrEmpty(request.BatchNumber))
            item.BatchNumber = request.BatchNumber;
        if (request.ExpiryDate.HasValue)
            item.ExpiryDate = request.ExpiryDate;

        item.QcPassed = request.QcPassed;
        item.QcSampleSize = request.QcSampleSize;
        item.QcPassedCount = request.QcPassedCount;
        item.QcNotes = request.QcNotes;
        item.InspectionNotes = request.InspectionNotes;
        item.UpdatedAt = DateTime.UtcNow;

        // Determine item status
        if (request.AcceptedQuantity == request.ReceivedQuantity)
            item.Status = ReceiptStatus.Accepted;
        else if (request.AcceptedQuantity == 0)
            item.Status = ReceiptStatus.Rejected;
        else if (request.QuarantineQuantity > 0)
            item.Status = ReceiptStatus.Quarantine;
        else
            item.Status = ReceiptStatus.Partial;

        await _context.SaveChangesAsync();
        return await GetReceiptByIdAsync(receiptId);
    }

    public async Task<ReceiptDto?> CompleteInspectionAsync(Guid receiptId, CompleteInspectionRequest request, Guid staffId)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == receiptId);

        if (receipt == null) return null;

        if (receipt.Status != ReceiptStatus.Inspecting)
            throw new InvalidOperationException("Receipt must be in 'inspecting' status");

        // Verify all items have been inspected
        var uninspectedItems = receipt.Items.Where(i => i.ReceivedQuantity == 0 && i.ExpectedQuantity > 0).ToList();
        if (uninspectedItems.Any())
            throw new InvalidOperationException($"{uninspectedItems.Count} items have not been inspected");

        // Calculate totals
        receipt.TotalAccepted = receipt.Items.Sum(i => i.AcceptedQuantity);
        receipt.TotalDamaged = receipt.Items.Sum(i => i.DamagedQuantity);
        receipt.TotalMissing = receipt.Items.Sum(i => i.MissingQuantity);
        receipt.InspectionEnd = DateTime.UtcNow;
        receipt.InspectionNotes = request.InspectionNotes;
        receipt.UpdatedAt = DateTime.UtcNow;

        // Determine overall status
        if (receipt.TotalAccepted == receipt.TotalExpected)
            receipt.Status = ReceiptStatus.Accepted;
        else if (receipt.TotalAccepted == 0)
            receipt.Status = ReceiptStatus.Rejected;
        else
            receipt.Status = ReceiptStatus.Partial;

        // Update shipment status to 'inspected'
        var shipment = await _context.SupplierShipments.FindAsync(receipt.ShipmentId);
        if (shipment != null)
        {
            shipment.Status = ShipmentStatus.Received;
            shipment.UpdatedAt = DateTime.UtcNow;

            // Add shipment history
            _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
            {
                Id = Guid.NewGuid(),
                ShipmentId = shipment.Id,
                PreviousStatus = ShipmentStatus.Received,
                NewStatus = ShipmentStatus.Received,
                Notes = $"Inspection completed: {receipt.TotalAccepted}/{receipt.TotalExpected} accepted",
                ChangedBy = staffId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return await GetReceiptByIdAsync(receiptId);
    }

    public async Task<ReceiptDto?> StoreReceiptAsync(Guid receiptId, Guid staffId)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Items)
                .ThenInclude(i => i.ShipmentItem)
            .Include(r => r.Shipment)
            .FirstOrDefaultAsync(r => r.Id == receiptId);

        if (receipt == null) return null;

        if (receipt.Status != ReceiptStatus.Accepted && receipt.Status != ReceiptStatus.Partial)
            throw new InvalidOperationException("Receipt must be in 'accepted' or 'partial' status to store");

        // Add accepted items to inventory
        foreach (var item in receipt.Items.Where(i => i.AcceptedQuantity > 0))
        {
            await _inventoryService.AddToInventoryAsync(new AddToInventoryRequest
            {
                ProductId = item.ProductId,
                WarehouseId = receipt.WarehouseId,
                Quantity = item.AcceptedQuantity,
                BatchNumber = item.BatchNumber,
                ExpiryDate = item.ExpiryDate,
                UnitCost = item.ShipmentItem?.UnitCost,
                ReceiptId = receipt.Id,
                StaffId = staffId
            });
        }

        // Add quarantine items with special type
        foreach (var item in receipt.Items.Where(i => i.QuarantineQuantity > 0))
        {
            await _inventoryService.AddToInventoryAsync(new AddToInventoryRequest
            {
                ProductId = item.ProductId,
                WarehouseId = receipt.WarehouseId,
                Quantity = item.QuarantineQuantity,
                BatchNumber = item.BatchNumber,
                ExpiryDate = item.ExpiryDate,
                UnitCost = item.ShipmentItem?.UnitCost,
                ReceiptId = receipt.Id,
                StaffId = staffId,
                InventoryType = InventoryType.Quarantine
            });
        }

        receipt.Status = ReceiptStatus.Completed;
        receipt.StoreDate = DateTime.UtcNow;
        receipt.UpdatedAt = DateTime.UtcNow;

        // Update shipment status to 'stored'
        if (receipt.Shipment != null)
        {
            receipt.Shipment.Status = ShipmentStatus.Success;
            receipt.Shipment.UpdatedAt = DateTime.UtcNow;

            _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
            {
                Id = Guid.NewGuid(),
                ShipmentId = receipt.Shipment.Id,
                PreviousStatus = ShipmentStatus.Received,
                NewStatus = ShipmentStatus.Success,
                Notes = "Items stored in inventory",
                ChangedBy = staffId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return await GetReceiptByIdAsync(receiptId);
    }

    private async Task<string> GenerateReceiptNumberAsync()
    {
        var today = DateTime.UtcNow;
        var prefix = $"RCP-{today:yyyyMMdd}-";
        
        var lastReceipt = await _context.Receipts
            .Where(r => r.ReceiptNumber.StartsWith(prefix))
            .OrderByDescending(r => r.ReceiptNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastReceipt != null)
        {
            var lastNumberStr = lastReceipt.ReceiptNumber.Substring(prefix.Length);
            if (int.TryParse(lastNumberStr, out var lastNumber))
                nextNumber = lastNumber + 1;
        }

        return $"{prefix}{nextNumber:D4}";
    }

    private ReceiptDto MapToDto(Receipt receipt)
    {
        return new ReceiptDto
        {
            Id = receipt.Id,
            ReceiptNumber = receipt.ReceiptNumber,
            ShipmentId = receipt.ShipmentId,
            ShipmentReference = receipt.Shipment?.ExternalReference,
            WarehouseId = receipt.WarehouseId,
            WarehouseName = receipt.Warehouse?.Name,
            ReceivedBy = receipt.ReceivedBy,
            ReceivedByName = receipt.ReceivedByStaff?.User?.FullName,
            InspectedBy = receipt.InspectedBy,
            InspectedByName = receipt.InspectedByStaff?.User?.FullName,
            Status = receipt.Status.ToString().ToLower(),
            ArrivalDate = receipt.ArrivalDate,
            InspectionStart = receipt.InspectionStart,
            InspectionEnd = receipt.InspectionEnd,
            StoreDate = receipt.StoreDate,
            TotalExpected = receipt.TotalExpected,
            TotalAccepted = receipt.TotalAccepted,
            TotalDamaged = receipt.TotalDamaged,
            TotalMissing = receipt.TotalMissing,
            Notes = receipt.Notes,
            InspectionNotes = receipt.InspectionNotes,
            CreatedAt = receipt.CreatedAt,
            Items = receipt.Items.Select(i => new ReceiptItemDto
            {
                Id = i.Id,
                ShipmentItemId = i.ShipmentItemId,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                ProductSku = i.Product?.Sku,
                ExpectedQuantity = i.ExpectedQuantity,
                ReceivedQuantity = i.ReceivedQuantity,
                AcceptedQuantity = i.AcceptedQuantity,
                DamagedQuantity = i.DamagedQuantity,
                MissingQuantity = i.MissingQuantity,
                QuarantineQuantity = i.QuarantineQuantity,
                BatchNumber = i.BatchNumber,
                ExpiryDate = i.ExpiryDate,
                Status = i.Status.ToString().ToLower(),
                QcRequired = i.QcRequired,
                QcPassed = i.QcPassed,
                QcSampleSize = i.QcSampleSize,
                QcPassedCount = i.QcPassedCount,
                QcNotes = i.QcNotes,
                InspectionNotes = i.InspectionNotes
            }).ToList()
        };
    }
}

// Helper DTO for adding to inventory
public class AddToInventoryRequest
{
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public int Quantity { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal? UnitCost { get; set; }
    public Guid? ReceiptId { get; set; }
    public Guid StaffId { get; set; }
    public InventoryType InventoryType { get; set; } = InventoryType.Available;
}
