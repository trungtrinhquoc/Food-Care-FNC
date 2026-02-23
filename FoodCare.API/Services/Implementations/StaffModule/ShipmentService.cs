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

public class ShipmentService : IShipmentService
{
    private readonly FoodCareDbContext _context;

    public ShipmentService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<SupplierShipmentDto>> GetShipmentsAsync(ShipmentQueryParams queryParams)
    {
        var query = _context.SupplierShipments
            .Include(s => s.Supplier)
            .Include(s => s.Warehouse)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .AsQueryable();

        if (queryParams.SupplierId.HasValue)
        {
            query = query.Where(s => s.SupplierId == queryParams.SupplierId.Value);
        }

        if (queryParams.WarehouseId.HasValue)
        {
            query = query.Where(s => s.WarehouseId == queryParams.WarehouseId.Value);
        }

        if (!string.IsNullOrEmpty(queryParams.Status) && Enum.TryParse<ShipmentStatus>(queryParams.Status, true, out var status))
        {
            query = query.Where(s => s.Status == status);
        }

        if (queryParams.FromDate.HasValue)
        {
            query = query.Where(s => s.ExpectedDeliveryDate >= queryParams.FromDate.Value);
        }

        if (queryParams.ToDate.HasValue)
        {
            query = query.Where(s => s.ExpectedDeliveryDate <= queryParams.ToDate.Value);
        }

        if (!string.IsNullOrEmpty(queryParams.SearchTerm))
        {
            query = query.Where(s => 
                s.ExternalReference.Contains(queryParams.SearchTerm) ||
                (s.TrackingNumber != null && s.TrackingNumber.Contains(queryParams.SearchTerm)));
        }

        // Sorting
        query = queryParams.SortBy?.ToLower() switch
        {
            "expected_date" => queryParams.SortDescending 
                ? query.OrderByDescending(s => s.ExpectedDeliveryDate)
                : query.OrderBy(s => s.ExpectedDeliveryDate),
            "created_at" => queryParams.SortDescending 
                ? query.OrderByDescending(s => s.CreatedAt)
                : query.OrderBy(s => s.CreatedAt),
            _ => query.OrderByDescending(s => s.CreatedAt)
        };

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .Select(s => MapToDto(s))
            .ToListAsync();

        return new PagedResponse<SupplierShipmentDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = queryParams.Page,
            PageSize = queryParams.PageSize
        };
    }

    public async Task<SupplierShipmentDto?> GetShipmentByIdAsync(Guid id)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Supplier)
            .Include(s => s.Warehouse)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .Include(s => s.Documents)
            .FirstOrDefaultAsync(s => s.Id == id);

        return shipment != null ? MapToDto(shipment) : null;
    }

    public async Task<SupplierShipmentDto?> GetShipmentByReferenceAsync(string externalReference)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Supplier)
            .Include(s => s.Warehouse)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .Include(s => s.Documents)
            .FirstOrDefaultAsync(s => s.ExternalReference == externalReference);

        return shipment != null ? MapToDto(shipment) : null;
    }

    public async Task<SupplierShipmentDto> CreateShipmentAsync(int supplierId, Guid userId, CreateShipmentRequest request)
    {
        // Verify supplier exists
        var supplier = await _context.Suppliers.FindAsync(supplierId);
        if (supplier == null)
        {
            throw new ArgumentException("Supplier not found");
        }

        // Check for duplicate external reference (idempotency)
        var existingShipment = await _context.SupplierShipments
            .FirstOrDefaultAsync(s => s.ExternalReference == request.ExternalReference);
        if (existingShipment != null)
        {
            // Return existing shipment for idempotency
            return (await GetShipmentByIdAsync(existingShipment.Id))!;
        }

        // Verify warehouse exists
        var warehouse = await _context.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null || !warehouse.IsActive)
        {
            throw new ArgumentException("Warehouse not found or inactive");
        }

        var shipment = new SupplierShipment
        {
            Id = Guid.NewGuid(),
            ExternalReference = request.ExternalReference,
            SupplierId = supplierId,
            WarehouseId = request.WarehouseId,
            Status = ShipmentStatus.Draft,
            ExpectedDeliveryDate = request.ExpectedDeliveryDate,
            TrackingNumber = request.TrackingNumber,
            Carrier = request.Carrier,
            Notes = request.Notes,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        // Add items
        decimal totalValue = 0;
        int totalQuantity = 0;

        foreach (var itemRequest in request.Items)
        {
            var product = await _context.Products.FindAsync(itemRequest.ProductId);
            if (product == null)
            {
                throw new ArgumentException($"Product {itemRequest.ProductId} not found");
            }

            var item = new ShipmentItem
            {
                Id = Guid.NewGuid(),
                ShipmentId = shipment.Id,
                ProductId = itemRequest.ProductId,
                ExpectedQuantity = itemRequest.Quantity,
                Uom = itemRequest.Uom,
                BatchNumber = itemRequest.BatchNumber,
                ExpiryDate = itemRequest.ExpiryDate,
                ManufactureDate = itemRequest.ManufactureDate,
                UnitCost = itemRequest.UnitCost,
                LineTotal = itemRequest.UnitCost.HasValue ? itemRequest.UnitCost.Value * itemRequest.Quantity : null,
                Notes = itemRequest.Notes,
                CreatedAt = DateTime.UtcNow
            };

            shipment.Items.Add(item);
            totalQuantity += itemRequest.Quantity;
            if (item.LineTotal.HasValue)
            {
                totalValue += item.LineTotal.Value;
            }
        }

        shipment.TotalItems = request.Items.Count;
        shipment.TotalQuantity = totalQuantity;
        shipment.TotalValue = totalValue > 0 ? totalValue : null;

        // Create initial status history
        var statusHistory = new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            PreviousStatus = null,
            NewStatus = ShipmentStatus.Draft,
            Notes = "Shipment created",
            ChangedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.SupplierShipments.Add(shipment);
        _context.ShipmentStatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return (await GetShipmentByIdAsync(shipment.Id))!;
    }

    public async Task<SupplierShipmentDto?> UpdateShipmentStatusAsync(Guid id, Guid userId, UpdateShipmentStatusRequest request)
    {
        var shipment = await _context.SupplierShipments.FindAsync(id);
        if (shipment == null) return null;

        if (!Enum.TryParse<ShipmentStatus>(request.Status, true, out var newStatus))
        {
            throw new ArgumentException("Invalid status");
        }

        // Validate status transition
        if (!IsValidStatusTransition(shipment.Status, newStatus))
        {
            throw new InvalidOperationException($"Cannot transition from {shipment.Status} to {newStatus}");
        }

        var previousStatus = shipment.Status;
        var previousEta = shipment.ExpectedDeliveryDate;

        shipment.Status = newStatus;
        shipment.UpdatedAt = DateTime.UtcNow;

        if (request.NewEta.HasValue)
        {
            shipment.ExpectedDeliveryDate = request.NewEta.Value;
        }

        // Set actual dates based on status
        if (newStatus == ShipmentStatus.Dispatched && !shipment.ActualDispatchDate.HasValue)
        {
            shipment.ActualDispatchDate = DateTime.UtcNow;
        }
        else if (newStatus == ShipmentStatus.Arrived && !shipment.ActualArrivalDate.HasValue)
        {
            shipment.ActualArrivalDate = DateTime.UtcNow;
        }

        // Create status history
        var statusHistory = new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            PreviousEta = request.NewEta.HasValue ? previousEta : null,
            NewEta = request.NewEta,
            Notes = request.Notes,
            ChangedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ShipmentStatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return await GetShipmentByIdAsync(id);
    }

    public async Task<bool> CancelShipmentAsync(Guid id, Guid userId, string? reason = null)
    {
        var shipment = await _context.SupplierShipments.FindAsync(id);
        if (shipment == null) return false;

        if (shipment.Status == ShipmentStatus.Stored || shipment.Status == ShipmentStatus.Closed)
        {
            throw new InvalidOperationException("Cannot cancel a shipment that has been stored or closed");
        }

        var previousStatus = shipment.Status;
        shipment.Status = ShipmentStatus.Cancelled;
        shipment.UpdatedAt = DateTime.UtcNow;

        var statusHistory = new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            PreviousStatus = previousStatus,
            NewStatus = ShipmentStatus.Cancelled,
            Notes = reason ?? "Shipment cancelled",
            ChangedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ShipmentStatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<ShipmentItemDto>> GetShipmentItemsAsync(Guid shipmentId)
    {
        return await _context.ShipmentItems
            .Include(i => i.Product)
            .Where(i => i.ShipmentId == shipmentId)
            .Select(i => new ShipmentItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                ProductSku = i.Product.Sku,
                ExpectedQuantity = i.ExpectedQuantity,
                Uom = i.Uom,
                BatchNumber = i.BatchNumber,
                ExpiryDate = i.ExpiryDate,
                ManufactureDate = i.ManufactureDate,
                UnitCost = i.UnitCost,
                LineTotal = i.LineTotal,
                Notes = i.Notes
            })
            .ToListAsync();
    }

    public async Task<ShipmentDocumentDto> AddDocumentAsync(Guid shipmentId, Guid userId, string documentType, string fileName, string fileUrl, string? mimeType = null, long? fileSize = null)
    {
        var shipment = await _context.SupplierShipments.FindAsync(shipmentId);
        if (shipment == null)
        {
            throw new ArgumentException("Shipment not found");
        }

        var document = new ShipmentDocument
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipmentId,
            DocumentType = documentType,
            FileName = fileName,
            FileUrl = fileUrl,
            MimeType = mimeType,
            FileSize = fileSize,
            UploadedBy = userId,
            UploadedAt = DateTime.UtcNow
        };

        _context.ShipmentDocuments.Add(document);
        await _context.SaveChangesAsync();

        return new ShipmentDocumentDto
        {
            Id = document.Id,
            DocumentType = document.DocumentType,
            FileName = document.FileName,
            FileUrl = document.FileUrl,
            MimeType = document.MimeType,
            FileSize = document.FileSize,
            UploadedAt = document.UploadedAt
        };
    }

    public async Task<List<ShipmentDocumentDto>> GetDocumentsAsync(Guid shipmentId)
    {
        return await _context.ShipmentDocuments
            .Where(d => d.ShipmentId == shipmentId)
            .Select(d => new ShipmentDocumentDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType,
                FileName = d.FileName,
                FileUrl = d.FileUrl,
                MimeType = d.MimeType,
                FileSize = d.FileSize,
                UploadedAt = d.UploadedAt
            })
            .ToListAsync();
    }

    public async Task<bool> DeleteDocumentAsync(Guid documentId)
    {
        var document = await _context.ShipmentDocuments.FindAsync(documentId);
        if (document == null) return false;

        _context.ShipmentDocuments.Remove(document);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<ShipmentStatusHistoryDto>> GetStatusHistoryAsync(Guid shipmentId)
    {
        return await _context.ShipmentStatusHistories
            .Include(h => h.ChangedByUser)
            .Where(h => h.ShipmentId == shipmentId)
            .OrderByDescending(h => h.CreatedAt)
            .Select(h => new ShipmentStatusHistoryDto
            {
                Id = h.Id,
                PreviousStatus = h.PreviousStatus.HasValue ? h.PreviousStatus.Value.ToString() : null,
                NewStatus = h.NewStatus.ToString(),
                PreviousEta = h.PreviousEta,
                NewEta = h.NewEta,
                Notes = h.Notes,
                ChangedByName = h.ChangedByUser != null ? h.ChangedByUser.FullName : null,
                CreatedAt = h.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<PagedResponse<SupplierShipmentDto>> GetSupplierShipmentsAsync(int supplierId, ShipmentQueryParams queryParams)
    {
        queryParams.SupplierId = supplierId;
        return await GetShipmentsAsync(queryParams);
    }

    private static bool IsValidStatusTransition(ShipmentStatus current, ShipmentStatus next)
    {
        return (current, next) switch
        {
            (ShipmentStatus.Draft, ShipmentStatus.Dispatched) => true,
            (ShipmentStatus.Draft, ShipmentStatus.Cancelled) => true,
            (ShipmentStatus.Dispatched, ShipmentStatus.InTransit) => true,
            (ShipmentStatus.Dispatched, ShipmentStatus.Arrived) => true,
            (ShipmentStatus.Dispatched, ShipmentStatus.Cancelled) => true,
            (ShipmentStatus.InTransit, ShipmentStatus.Arrived) => true,
            (ShipmentStatus.InTransit, ShipmentStatus.Cancelled) => true,
            (ShipmentStatus.Arrived, ShipmentStatus.Inspected) => true,
            (ShipmentStatus.Inspected, ShipmentStatus.Stored) => true,
            (ShipmentStatus.Stored, ShipmentStatus.Closed) => true,
            _ => false
        };
    }

    private static SupplierShipmentDto MapToDto(SupplierShipment shipment)
    {
        return new SupplierShipmentDto
        {
            Id = shipment.Id,
            ExternalReference = shipment.ExternalReference,
            SupplierId = shipment.SupplierId,
            SupplierName = shipment.Supplier?.StoreName,
            WarehouseId = shipment.WarehouseId,
            WarehouseName = shipment.Warehouse?.Name,
            Status = shipment.Status.ToString(),
            ExpectedDeliveryDate = shipment.ExpectedDeliveryDate,
            ActualDispatchDate = shipment.ActualDispatchDate,
            ActualArrivalDate = shipment.ActualArrivalDate,
            TrackingNumber = shipment.TrackingNumber,
            Carrier = shipment.Carrier,
            Notes = shipment.Notes,
            TotalValue = shipment.TotalValue,
            TotalItems = shipment.TotalItems,
            TotalQuantity = shipment.TotalQuantity,
            CreatedAt = shipment.CreatedAt,
            Items = shipment.Items?.Select(i => new ShipmentItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                ProductSku = i.Product?.Sku,
                ExpectedQuantity = i.ExpectedQuantity,
                Uom = i.Uom,
                BatchNumber = i.BatchNumber,
                ExpiryDate = i.ExpiryDate,
                ManufactureDate = i.ManufactureDate,
                UnitCost = i.UnitCost,
                LineTotal = i.LineTotal,
                Notes = i.Notes
            }).ToList() ?? new List<ShipmentItemDto>(),
            Documents = shipment.Documents?.Select(d => new ShipmentDocumentDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType,
                FileName = d.FileName,
                FileUrl = d.FileUrl,
                MimeType = d.MimeType,
                FileSize = d.FileSize,
                UploadedAt = d.UploadedAt
            }).ToList() ?? new List<ShipmentDocumentDto>()
        };
    }

    // Supplier-facing methods
    public async Task<PagedResponse<SupplierShipmentDto>> GetShipmentsBySupplierAsync(Guid supplierId, int page, int pageSize, string? status)
    {
        var queryParams = new ShipmentQueryParams
        {
            Page = page,
            PageSize = pageSize,
            Status = status
        };
        // Convert Guid to int for SupplierId (assuming supplier has int ID in database)
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == supplierId);
        if (supplier != null)
        {
            queryParams.SupplierId = supplier.Id;
        }
        return await GetShipmentsAsync(queryParams);
    }

    public async Task<SupplierShipmentDto> CreateShipmentAsync(CreateSupplierShipmentRequest request, Guid supplierId)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == supplierId);
        if (supplier == null)
            throw new ArgumentException("Supplier not found");

        // AUTO-ASSIGN WAREHOUSE BY REGION if not provided
        Guid warehouseId;
        if (request.WarehouseId.HasValue && request.WarehouseId.Value != Guid.Empty)
        {
            warehouseId = request.WarehouseId.Value;
        }
        else
        {
            // Determine region from supplier's city
            var region = WarehouseService.DetermineRegionFromCity(supplier.AddressCity);
            var warehouse = region != null 
                ? await _context.Warehouses
                    .Where(w => w.IsActive && w.Region != null && w.Region.ToLower() == region.ToLower())
                    .FirstOrDefaultAsync()
                : null;

            // Fallback: use default warehouse
            warehouse ??= await _context.Warehouses
                .Where(w => w.IsActive && w.IsDefault)
                .FirstOrDefaultAsync();

            // Last resort: any active warehouse
            warehouse ??= await _context.Warehouses
                .Where(w => w.IsActive)
                .FirstOrDefaultAsync();

            if (warehouse == null)
                throw new InvalidOperationException("No active warehouse available for assignment");

            warehouseId = warehouse.Id;
        }

        // Convert to standard CreateShipmentRequest
        var createRequest = new CreateShipmentRequest
        {
            WarehouseId = warehouseId,
            ExternalReference = request.ExternalReference ?? Guid.NewGuid().ToString("N")[..12],
            ExpectedDeliveryDate = request.ExpectedDeliveryDate,
            Notes = request.Notes
        };

        return await CreateShipmentAsync(supplier.Id, supplierId, createRequest);
    }

    public async Task<SupplierShipmentDto?> UpdateShipmentAsync(Guid id, UpdateSupplierShipmentRequest request)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Draft)
            throw new InvalidOperationException("Only draft shipments can be updated");

        if (request.ExpectedDeliveryDate.HasValue)
            shipment.ExpectedDeliveryDate = request.ExpectedDeliveryDate.Value;
        if (request.Notes != null)
            shipment.Notes = request.Notes;
        // UpdateSupplierShipmentRequest doesn't have DestinationWarehouseId, removed

        shipment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return await GetShipmentByIdAsync(id);
    }

    public async Task<SupplierShipmentDto?> AddShipmentItemAsync(Guid shipmentId, AddShipmentItemRequest request)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Draft)
            throw new InvalidOperationException("Cannot add items to non-draft shipment");

        var item = new ShipmentItem
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipmentId,
            ProductId = request.ProductId,
            ExpectedQuantity = request.Quantity, // Changed from ExpectedQuantity
            Uom = request.Uom ?? "pcs",
            BatchNumber = request.BatchNumber,
            ExpiryDate = request.ExpiryDate,
            ManufactureDate = request.ManufactureDate,
            UnitCost = request.UnitCost,
            LineTotal = request.Quantity * (request.UnitCost ?? 0),
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        shipment.Items.Add(item);
        shipment.TotalItems = shipment.Items.Count;
        shipment.TotalQuantity = shipment.Items.Sum(i => i.ExpectedQuantity);
        shipment.TotalValue = shipment.Items.Sum(i => i.LineTotal);
        shipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetShipmentByIdAsync(shipmentId);
    }

    public async Task<SupplierShipmentDto?> UpdateShipmentItemAsync(Guid shipmentId, Guid itemId, UpdateShipmentItemRequest request)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Draft)
            throw new InvalidOperationException("Cannot update items in non-draft shipment");

        var item = shipment.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return null;

        if (request.Quantity.HasValue) // Changed from ExpectedQuantity
            item.ExpectedQuantity = request.Quantity.Value;
        if (request.BatchNumber != null)
            item.BatchNumber = request.BatchNumber;
        if (request.ExpiryDate.HasValue)
            item.ExpiryDate = request.ExpiryDate;
        if (request.UnitCost.HasValue)
            item.UnitCost = request.UnitCost.Value;
        if (request.Notes != null)
            item.Notes = request.Notes;

        item.LineTotal = item.ExpectedQuantity * item.UnitCost;

        shipment.TotalQuantity = shipment.Items.Sum(i => i.ExpectedQuantity);
        shipment.TotalValue = shipment.Items.Sum(i => i.LineTotal);
        shipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetShipmentByIdAsync(shipmentId);
    }

    public async Task<bool> RemoveShipmentItemAsync(Guid shipmentId, Guid itemId)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

        if (shipment == null) return false;

        if (shipment.Status != ShipmentStatus.Draft)
            throw new InvalidOperationException("Cannot remove items from non-draft shipment");

        var item = shipment.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return false;

        shipment.Items.Remove(item);
        shipment.TotalItems = shipment.Items.Count;
        shipment.TotalQuantity = shipment.Items.Sum(i => i.ExpectedQuantity);
        shipment.TotalValue = shipment.Items.Sum(i => i.LineTotal);
        shipment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ShipmentDocumentDto> AddDocumentAsync(Guid shipmentId, AddShipmentDocumentRequest request)
    {
        return await AddDocumentAsync(shipmentId, Guid.Empty, request.DocumentType, request.FileName, request.FileUrl, request.MimeType, request.FileSize);
    }

    public async Task<SupplierShipmentDto?> DispatchShipmentAsync(Guid id, DispatchShipmentRequest request)
    {
        var shipment = await _context.SupplierShipments.FindAsync(id);
        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Draft)
            throw new InvalidOperationException("Only draft shipments can be dispatched");

        // DOCUMENT CHECK: Require at least one document (biên lai / chứng từ giao hàng)
        var hasDocuments = await _context.ShipmentDocuments
            .AnyAsync(d => d.ShipmentId == id);
        if (!hasDocuments)
            throw new InvalidOperationException("Cannot dispatch shipment without uploaded documents (biên lai / chứng từ giao hàng). Please upload at least one document first.");

        // ITEMS CHECK: Require at least one item
        var hasItems = await _context.ShipmentItems
            .AnyAsync(i => i.ShipmentId == id);
        if (!hasItems)
            throw new InvalidOperationException("Cannot dispatch shipment without items");

        shipment.Status = ShipmentStatus.Dispatched;
        shipment.ActualDispatchDate = request.ActualDispatchDate ?? DateTime.UtcNow;
        shipment.TrackingNumber = request.TrackingNumber;
        shipment.Carrier = request.Carrier;
        shipment.UpdatedAt = DateTime.UtcNow;

        // Add status history inline
        var statusHistory = new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            NewStatus = ShipmentStatus.Dispatched,
            ChangedBy = Guid.Empty,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };
        _context.ShipmentStatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return await GetShipmentByIdAsync(id);
    }

    public async Task<SupplierShipmentDto?> MarkInTransitAsync(Guid id, UpdateTransitRequest request)
    {
        var shipment = await _context.SupplierShipments.FindAsync(id);
        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Dispatched)
            throw new InvalidOperationException("Shipment must be dispatched before marking in transit");

        shipment.Status = ShipmentStatus.InTransit;
        if (request.NewEta.HasValue)
            shipment.ExpectedDeliveryDate = request.NewEta.Value;
        shipment.UpdatedAt = DateTime.UtcNow;

        // Add status history inline
        var statusHistory = new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            NewStatus = ShipmentStatus.InTransit,
            ChangedBy = Guid.Empty,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };
        _context.ShipmentStatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return await GetShipmentByIdAsync(id);
    }

    public async Task<bool> CancelShipmentAsync(Guid id, CancelShipmentRequest request)
    {
        return await CancelShipmentAsync(id, Guid.Empty, request.Reason);
    }

    public async Task<object> GetSupplierShipmentStatsAsync(Guid supplierId)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == supplierId);
        if (supplier == null)
            return new { total = 0, draft = 0, dispatched = 0, inTransit = 0, arrived = 0 };

        var shipments = await _context.SupplierShipments
            .Where(s => s.SupplierId == supplier.Id)
            .ToListAsync();

        return new
        {
            total = shipments.Count,
            draft = shipments.Count(s => s.Status == ShipmentStatus.Draft),
            dispatched = shipments.Count(s => s.Status == ShipmentStatus.Dispatched),
            inTransit = shipments.Count(s => s.Status == ShipmentStatus.InTransit),
            arrived = shipments.Count(s => s.Status == ShipmentStatus.Arrived),
            inspected = shipments.Count(s => s.Status == ShipmentStatus.Inspected),
            stored = shipments.Count(s => s.Status == ShipmentStatus.Stored)
        };
    }
}
