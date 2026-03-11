using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.Staff;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Helpers;
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
            .Include(s => s.InboundSession)
            .AsQueryable();

        if (queryParams.SupplierId.HasValue)
            query = query.Where(s => s.SupplierId == queryParams.SupplierId.Value);
        if (queryParams.WarehouseId.HasValue)
            query = query.Where(s => s.WarehouseId == queryParams.WarehouseId.Value);
        if (!string.IsNullOrEmpty(queryParams.Status) && Enum.TryParse<ShipmentStatus>(queryParams.Status, true, out var status))
            query = query.Where(s => s.Status == status);
        if (queryParams.FromDate.HasValue)
            query = query.Where(s => s.ExpectedDeliveryDate >= queryParams.FromDate.Value);
        if (queryParams.ToDate.HasValue)
            query = query.Where(s => s.ExpectedDeliveryDate <= queryParams.ToDate.Value);
        if (!string.IsNullOrEmpty(queryParams.SearchTerm))
            query = query.Where(s =>
                s.ExternalReference.Contains(queryParams.SearchTerm) ||
                (s.TrackingNumber != null && s.TrackingNumber.Contains(queryParams.SearchTerm)));

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
            .Include(s => s.InboundSession)
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
            .Include(s => s.InboundSession)
            .FirstOrDefaultAsync(s => s.ExternalReference == externalReference);

        return shipment != null ? MapToDto(shipment) : null;
    }

    public async Task<SupplierShipmentDto> CreateShipmentAsync(int supplierId, Guid userId, CreateShipmentRequest request)
    {
        var supplier = await _context.Suppliers.FindAsync(supplierId);
        if (supplier == null)
            throw new ArgumentException("Supplier not found");

        var existingShipment = await _context.SupplierShipments
            .FirstOrDefaultAsync(s => s.ExternalReference == request.ExternalReference);
        if (existingShipment != null)
            return (await GetShipmentByIdAsync(existingShipment.Id))!;

        var warehouse = await _context.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null || !warehouse.IsActive)
            throw new ArgumentException("Warehouse not found or inactive");

        var shipment = new SupplierShipment
        {
            Id = Guid.NewGuid(),
            ExternalReference = request.ExternalReference,
            SupplierId = supplierId,
            WarehouseId = request.WarehouseId,
            Status = ShipmentStatus.Preparing,
            ExpectedDeliveryDate = request.ExpectedDeliveryDate,
            TrackingNumber = request.TrackingNumber,
            Carrier = request.Carrier,
            Notes = request.Notes,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        decimal totalValue = 0;
        int totalQuantity = 0;

        foreach (var itemRequest in request.Items)
        {
            var product = await _context.Products.FindAsync(itemRequest.ProductId);
            if (product == null)
                throw new ArgumentException($"Product {itemRequest.ProductId} not found");

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
                totalValue += item.LineTotal.Value;
        }

        shipment.TotalItems = request.Items.Count;
        shipment.TotalQuantity = totalQuantity;
        shipment.TotalValue = totalValue > 0 ? totalValue : null;

        var statusHistory = new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            PreviousStatus = null,
            NewStatus = ShipmentStatus.Preparing,
            Notes = "Lo hang da duoc tao - dang chuan bi hang",
            ChangedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.SupplierShipments.Add(shipment);
        _context.ShipmentStatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return (await GetShipmentByIdAsync(shipment.Id))!;
    }

    public async Task<bool> CancelShipmentAsync(Guid id, Guid userId, string? reason = null)
    {
        var shipment = await _context.SupplierShipments.FindAsync(id);
        if (shipment == null) return false;

        if (shipment.Status == ShipmentStatus.Success)
            throw new InvalidOperationException("Khong the huy lo hang da hoan tat");

        var previousStatus = shipment.Status;
        shipment.Status = ShipmentStatus.Cancelled;
        shipment.UpdatedAt = DateTime.UtcNow;

        _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            PreviousStatus = previousStatus,
            NewStatus = ShipmentStatus.Cancelled,
            Notes = reason ?? "Lo hang da bi huy",
            ChangedBy = userId,
            CreatedAt = DateTime.UtcNow
        });

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
                ReceivedQuantity = i.ReceivedQuantity,
                DamagedQuantity = i.DamagedQuantity,
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
            throw new ArgumentException("Shipment not found");

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

    // =====================================================
    // SIMPLIFIED STATUS TRANSITIONS
    // =====================================================

    public async Task<SupplierShipmentDto?> StartDeliveringAsync(Guid id, StartDeliveringRequest request)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .Include(s => s.Supplier)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Preparing)
            throw new InvalidOperationException("Chi co the bat dau giao hang khi dang o trang thai 'Dang chuan bi'");

        if (!shipment.Items.Any())
            throw new InvalidOperationException("Khong the giao hang khi lo hang chua co san pham");

        var oldStatus = shipment.Status;
        shipment.Status = ShipmentStatus.Delivering;
        shipment.ActualDispatchDate = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(request.TrackingNumber))
            shipment.TrackingNumber = request.TrackingNumber;
        if (!string.IsNullOrEmpty(request.Carrier))
            shipment.Carrier = request.Carrier;
        shipment.UpdatedAt = DateTime.UtcNow;

        _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            PreviousStatus = oldStatus,
            NewStatus = ShipmentStatus.Delivering,
            Notes = request.Notes ?? "Supplier bat dau giao hang",
            ChangedBy = Guid.Empty,
            CreatedAt = DateTime.UtcNow
        });

        await NotificationHelper.NotifyWarehouseStaffAsync(_context,
            shipment.WarehouseId,
            "Lo hang dang duoc giao den",
            $"Lo hang {shipment.ExternalReference} dang tren duong giao den kho.",
            "shipment_delivering",
            $"/staff/shipping?id={shipment.Id}");

        await _context.SaveChangesAsync();
        return await GetShipmentByIdAsync(id);
    }

    public async Task<SupplierShipmentDto?> ConfirmReceivedAsync(Guid id, ConfirmReceivedRequest request)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .Include(s => s.Supplier)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Delivering)
            throw new InvalidOperationException("Chi co the xac nhan nhan hang khi lo hang dang o trang thai 'Dang giao'");

        foreach (var receivedItem in request.Items)
        {
            var item = shipment.Items.FirstOrDefault(i => i.Id == receivedItem.ShipmentItemId);
            if (item == null) continue;

            item.ReceivedQuantity = receivedItem.ReceivedQuantity;
            item.DamagedQuantity = receivedItem.DamagedQuantity;
            item.UpdatedAt = DateTime.UtcNow;
        }

        var oldStatus = shipment.Status;
        shipment.Status = ShipmentStatus.Received;
        shipment.ActualArrivalDate = DateTime.UtcNow;
        shipment.UpdatedAt = DateTime.UtcNow;

        _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            PreviousStatus = oldStatus,
            NewStatus = ShipmentStatus.Received,
            Notes = request.Notes ?? "Staff da xac nhan nhan hang",
            ChangedBy = Guid.Empty,
            CreatedAt = DateTime.UtcNow
        });

        if (shipment.Supplier != null)
        {
            await NotificationHelper.CreateDeliveryNotificationAsync(_context,
                shipment, shipment.Supplier,
                "Lo hang da duoc nhan",
                $"Lo hang {shipment.ExternalReference} da duoc kho nhan thanh cong.",
                "shipment_received");
        }

        await _context.SaveChangesAsync();
        return await GetShipmentByIdAsync(id);
    }

    public async Task<SupplierShipmentDto?> CompleteShipmentAsync(Guid id)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Supplier)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Received)
            throw new InvalidOperationException("Chi co the hoan tat khi lo hang da duoc nhan");

        var oldStatus = shipment.Status;
        shipment.Status = ShipmentStatus.Success;
        shipment.UpdatedAt = DateTime.UtcNow;

        if (shipment.InboundSessionSupplierId.HasValue)
        {
            var sessionSupplier = await _context.InboundSessionSuppliers.FindAsync(shipment.InboundSessionSupplierId.Value);
            if (sessionSupplier != null)
            {
                sessionSupplier.Status = "Completed";
                sessionSupplier.UpdatedAt = DateTime.UtcNow;
            }
        }

        _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            PreviousStatus = oldStatus,
            NewStatus = ShipmentStatus.Success,
            Notes = "Lo hang da hoan tat thanh cong",
            ChangedBy = Guid.Empty,
            CreatedAt = DateTime.UtcNow
        });

        if (shipment.Supplier != null)
        {
            await NotificationHelper.CreateDeliveryNotificationAsync(_context,
                shipment, shipment.Supplier,
                "Lo hang hoan tat",
                $"Lo hang {shipment.ExternalReference} da duoc xu ly hoan tat.",
                "shipment_success");
        }

        await _context.SaveChangesAsync();
        return await GetShipmentByIdAsync(id);
    }

    // =====================================================
    // SUPPLIER-FACING METHODS
    // =====================================================

    public async Task<PagedResponse<SupplierShipmentDto>> GetShipmentsBySupplierAsync(Guid supplierId, int page, int pageSize, string? status)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == supplierId);
        var queryParams = new ShipmentQueryParams
        {
            Page = page,
            PageSize = pageSize,
            Status = status
        };
        if (supplier != null)
            queryParams.SupplierId = supplier.Id;
        return await GetShipmentsAsync(queryParams);
    }

    public async Task<SupplierShipmentDto> CreateShipmentAsync(CreateSupplierShipmentRequest request, Guid supplierId)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == supplierId);
        if (supplier == null)
            throw new ArgumentException("Supplier not found");

        Guid? inboundSessionSupplierId = null;
        if (request.InboundSessionId.HasValue)
        {
            var sessionSupplier = await _context.InboundSessionSuppliers
                .Include(iss => iss.Session)
                .FirstOrDefaultAsync(iss =>
                    iss.SessionId == request.InboundSessionId.Value &&
                    iss.SupplierId == supplier.Id &&
                    iss.Status == "Registered");

            if (sessionSupplier == null)
                throw new ArgumentException("Ban chua dang ky phien nhap kho nay hoac phien khong ton tai");

            var session = sessionSupplier.Session;
            if (session.Status == InboundSessionStatus.Cancelled)
                throw new InvalidOperationException("Phien nhap kho da bi huy");

            var existingSessionShipment = await _context.SupplierShipments
                .AnyAsync(s => s.InboundSessionSupplierId == sessionSupplier.Id && s.Status != ShipmentStatus.Cancelled);
            if (existingSessionShipment)
                throw new InvalidOperationException("Ban da tao lo hang cho phien nhap kho nay roi");

            request.WarehouseId = session.WarehouseId;
            inboundSessionSupplierId = sessionSupplier.Id;
        }

        Guid warehouseId;
        if (request.WarehouseId.HasValue && request.WarehouseId.Value != Guid.Empty)
        {
            warehouseId = request.WarehouseId.Value;
        }
        else
        {
            var region = WarehouseService.DetermineRegionFromCity(supplier.AddressCity);
            var warehouse = region != null
                ? await _context.Warehouses
                    .Where(w => w.IsActive && w.Region != null && w.Region.ToLower() == region.ToLower())
                    .FirstOrDefaultAsync()
                : null;

            warehouse ??= await _context.Warehouses
                .Where(w => w.IsActive && w.IsDefault)
                .FirstOrDefaultAsync();
            warehouse ??= await _context.Warehouses
                .Where(w => w.IsActive)
                .FirstOrDefaultAsync();

            if (warehouse == null)
                throw new InvalidOperationException("No active warehouse available for assignment");

            warehouseId = warehouse.Id;
        }

        var createRequest = new CreateShipmentRequest
        {
            WarehouseId = warehouseId,
            ExternalReference = request.ExternalReference ?? Guid.NewGuid().ToString("N")[..12],
            ExpectedDeliveryDate = request.ExpectedDeliveryDate,
            Notes = request.Notes
        };

        var result = await CreateShipmentAsync(supplier.Id, supplierId, createRequest);

        // Link inbound session and auto-populate items from InboundReceipt
        if (request.InboundSessionId.HasValue)
        {
            var shipment = await _context.SupplierShipments.FindAsync(result.Id);
            if (shipment != null)
            {
                shipment.InboundSessionId = request.InboundSessionId.Value;
                shipment.InboundSessionSupplierId = inboundSessionSupplierId;

                var receipt = await _context.InboundReceipts
                    .Include(r => r.Details)
                    .FirstOrDefaultAsync(r =>
                        r.SessionId == request.InboundSessionId.Value &&
                        r.SupplierId == supplier.Id);

                if (receipt != null && receipt.Details.Any())
                {
                    decimal totalValue = 0;
                    int totalQuantity = 0;

                    foreach (var detail in receipt.Details)
                    {
                        var item = new ShipmentItem
                        {
                            Id = Guid.NewGuid(),
                            ShipmentId = shipment.Id,
                            ProductId = detail.ProductId,
                            ExpectedQuantity = detail.Quantity,
                            Uom = detail.Unit ?? "pcs",
                            BatchNumber = detail.BatchNumber,
                            ExpiryDate = detail.ExpiryDate,
                            ManufactureDate = detail.ManufactureDate,
                            UnitCost = detail.UnitPrice,
                            LineTotal = detail.LineTotal,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.ShipmentItems.Add(item);
                        totalQuantity += detail.Quantity;
                        totalValue += detail.LineTotal;
                    }

                    shipment.TotalItems = receipt.Details.Count;
                    shipment.TotalQuantity = totalQuantity;
                    shipment.TotalValue = totalValue > 0 ? totalValue : null;
                }

                await _context.SaveChangesAsync();
                result = (await GetShipmentByIdAsync(result.Id))!;
            }
        }

        return result;
    }

    public async Task<SupplierShipmentDto?> UpdateShipmentAsync(Guid id, UpdateSupplierShipmentRequest request)
    {
        var shipment = await _context.SupplierShipments.FindAsync(id);
        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Preparing)
            throw new InvalidOperationException("Chi co the chinh sua lo hang khi dang chuan bi");

        if (request.ExpectedDeliveryDate.HasValue)
            shipment.ExpectedDeliveryDate = request.ExpectedDeliveryDate.Value;
        if (request.Notes != null)
            shipment.Notes = request.Notes;

        shipment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return await GetShipmentByIdAsync(id);
    }

    public async Task<SupplierShipmentDto?> AddShipmentItemAsync(Guid shipmentId, AddShipmentItemRequest request)
    {
        _context.ChangeTracker.Clear();

        var shipment = await _context.SupplierShipments
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == shipmentId);
        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Preparing)
            throw new InvalidOperationException("Chi co the them san pham khi lo hang dang chuan bi");

        var item = new ShipmentItem
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipmentId,
            ProductId = request.ProductId,
            ExpectedQuantity = request.Quantity,
            Uom = request.Uom ?? "pcs",
            BatchNumber = request.BatchNumber,
            ExpiryDate = request.ExpiryDate,
            ManufactureDate = request.ManufactureDate,
            UnitCost = request.UnitCost,
            LineTotal = request.Quantity * (request.UnitCost ?? 0),
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.ShipmentItems.Add(item);
        await _context.SaveChangesAsync();

        var allItems = await _context.ShipmentItems
            .AsNoTracking()
            .Where(i => i.ShipmentId == shipmentId)
            .ToListAsync();

        var totalItems = allItems.Count;
        var totalQty = allItems.Sum(i => i.ExpectedQuantity);
        var totalVal = allItems.Sum(i => i.LineTotal ?? 0m);
        var now = DateTime.UtcNow;

        await _context.SupplierShipments
            .Where(s => s.Id == shipmentId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(s => s.TotalItems, totalItems)
                .SetProperty(s => s.TotalQuantity, totalQty)
                .SetProperty(s => s.TotalValue, totalVal)
                .SetProperty(s => s.UpdatedAt, now));

        _context.ChangeTracker.Clear();
        return await GetShipmentByIdAsync(shipmentId);
    }

    public async Task<SupplierShipmentDto?> UpdateShipmentItemAsync(Guid shipmentId, Guid itemId, UpdateShipmentItemRequest request)
    {
        _context.ChangeTracker.Clear();

        var shipment = await _context.SupplierShipments
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == shipmentId);
        if (shipment == null) return null;

        if (shipment.Status != ShipmentStatus.Preparing)
            throw new InvalidOperationException("Chi co the sua san pham khi lo hang dang chuan bi");

        var item = await _context.ShipmentItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.ShipmentId == shipmentId);
        if (item == null) return null;

        if (request.Quantity.HasValue)
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
        await _context.SaveChangesAsync();

        var allItems = await _context.ShipmentItems
            .AsNoTracking()
            .Where(i => i.ShipmentId == shipmentId)
            .ToListAsync();

        var totalQty = allItems.Sum(i => i.ExpectedQuantity);
        var totalVal = allItems.Sum(i => i.LineTotal ?? 0m);
        var now = DateTime.UtcNow;

        await _context.SupplierShipments
            .Where(s => s.Id == shipmentId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(s => s.TotalQuantity, totalQty)
                .SetProperty(s => s.TotalValue, totalVal)
                .SetProperty(s => s.UpdatedAt, now));

        _context.ChangeTracker.Clear();
        return await GetShipmentByIdAsync(shipmentId);
    }

    public async Task<bool> RemoveShipmentItemAsync(Guid shipmentId, Guid itemId)
    {
        _context.ChangeTracker.Clear();

        var shipment = await _context.SupplierShipments
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == shipmentId);
        if (shipment == null) return false;

        if (shipment.Status != ShipmentStatus.Preparing)
            throw new InvalidOperationException("Chi co the xoa san pham khi lo hang dang chuan bi");

        var item = await _context.ShipmentItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.ShipmentId == shipmentId);
        if (item == null) return false;

        _context.ShipmentItems.Remove(item);
        await _context.SaveChangesAsync();

        var allItems = await _context.ShipmentItems
            .AsNoTracking()
            .Where(i => i.ShipmentId == shipmentId)
            .ToListAsync();

        var totalItems = allItems.Count;
        var totalQty = allItems.Sum(i => i.ExpectedQuantity);
        var totalVal = allItems.Sum(i => i.LineTotal ?? 0m);
        var now = DateTime.UtcNow;

        await _context.SupplierShipments
            .Where(s => s.Id == shipmentId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(s => s.TotalItems, totalItems)
                .SetProperty(s => s.TotalQuantity, totalQty)
                .SetProperty(s => s.TotalValue, totalVal)
                .SetProperty(s => s.UpdatedAt, now));

        return true;
    }

    public async Task<ShipmentDocumentDto> AddDocumentAsync(Guid shipmentId, AddShipmentDocumentRequest request)
    {
        return await AddDocumentAsync(shipmentId, Guid.Empty, request.DocumentType, request.FileName, request.FileUrl, request.MimeType, request.FileSize);
    }

    public async Task<bool> CancelShipmentAsync(Guid id, CancelShipmentRequest request)
    {
        return await CancelShipmentAsync(id, Guid.Empty, request.Reason);
    }

    public async Task<object> GetSupplierShipmentStatsAsync(Guid supplierId)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == supplierId);
        if (supplier == null)
            return new { total = 0, preparing = 0, delivering = 0, received = 0, success = 0, cancelled = 0 };

        var shipments = await _context.SupplierShipments
            .Where(s => s.SupplierId == supplier.Id)
            .ToListAsync();

        return new
        {
            total = shipments.Count,
            preparing = shipments.Count(s => s.Status == ShipmentStatus.Preparing),
            delivering = shipments.Count(s => s.Status == ShipmentStatus.Delivering),
            received = shipments.Count(s => s.Status == ShipmentStatus.Received),
            success = shipments.Count(s => s.Status == ShipmentStatus.Success),
            cancelled = shipments.Count(s => s.Status == ShipmentStatus.Cancelled)
        };
    }

    // =====================================================
    // ADMIN OPERATIONS
    // =====================================================

    public async Task<bool> DeleteShipmentAsync(Guid id)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .Include(s => s.Documents)
            .Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (shipment == null) return false;

        _context.ShipmentStatusHistories.RemoveRange(shipment.StatusHistory);
        _context.ShipmentDocuments.RemoveRange(shipment.Documents);
        _context.ShipmentItems.RemoveRange(shipment.Items);
        _context.SupplierShipments.Remove(shipment);

        await _context.SaveChangesAsync();
        return true;
    }

    // =====================================================
    // HELPERS
    // =====================================================

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
            InboundSessionId = shipment.InboundSessionId,
            InboundSessionCode = shipment.InboundSession?.SessionCode,
            InboundSessionSupplierId = shipment.InboundSessionSupplierId,
            Items = shipment.Items?.Select(i => new ShipmentItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                ProductSku = i.Product?.Sku,
                ExpectedQuantity = i.ExpectedQuantity,
                ReceivedQuantity = i.ReceivedQuantity,
                DamagedQuantity = i.DamagedQuantity,
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
}
