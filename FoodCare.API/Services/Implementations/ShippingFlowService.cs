using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Shipping;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.Staff;
using FoodCare.API.Helpers;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations;

public class ShippingFlowService : IShippingFlowService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<ShippingFlowService> _logger;

    public ShippingFlowService(FoodCareDbContext context, ILogger<ShippingFlowService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Helper Methods

    private static string GetStatusLabel(string status)
    {
        return status switch
        {
            "Preparing" => "Đang chuẩn bị",
            "Delivering" => "Đang giao hàng",
            "Received" => "Đã nhận hàng",
            "Success" => "Hoàn tất",
            "Cancelled" => "Đã hủy",
            "pending" => "Chờ xử lý",
            "confirmed" => "Đã xác nhận",
            "shipping" => "Đang giao hàng",
            "delivered" => "Đã giao hàng",
            "cancelled" => "Đã hủy",
            "returned" => "Đã trả hàng",
            "OrderReceived" => "Đã nhận đơn",
            "StaffPreparing" => "Đang chuẩn bị",
            "StaffPacked" => "Đã đóng gói",
            "OutForDelivery" => "Đang giao hàng",
            "InTransitToUser" => "Đang vận chuyển",
            "Delivered" => "Đã giao hàng",
            "DeliveryFailed" => "Giao thất bại",
            _ => status
        };
    }

    private static int CalculateProgress(string status)
    {
        return status switch
        {
            "pending" => 10,
            "confirmed" => 25,
            "OrderReceived" => 25,
            "StaffPreparing" => 40,
            "StaffPacked" => 55,
            "OutForDelivery" => 70,
            "shipping" or "InTransitToUser" => 85,
            "delivered" or "Delivered" => 100,
            "cancelled" or "Cancelled" => 0,
            _ => 0
        };
    }

    private ShippingTimelineDto CreateTimelineEntry(string status, string? notes = null, string? location = null, string? handler = null)
    {
        return new ShippingTimelineDto
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Status = status,
            StatusLabel = GetStatusLabel(status),
            Description = GetTimelineDescription(status),
            Location = location,
            Notes = notes,
            Handler = handler
        };
    }

    private static string GetTimelineDescription(string status)
    {
        return status switch
        {
            "Preparing" => "Đơn hàng đang được chuẩn bị",
            "Delivering" => "Nhà cung cấp đang giao hàng",
            "Received" => "Kho đã nhận hàng",
            "Success" => "Hoàn tất nhập kho",
            "pending" => "Đơn hàng đã được tạo",
            "confirmed" => "Đơn hàng đã được xác nhận",
            "OrderReceived" => "Kho đã nhận đơn hàng",
            "StaffPreparing" => "Nhân viên đang chuẩn bị hàng",
            "StaffPacked" => "Đơn hàng đã được đóng gói",
            "OutForDelivery" => "Đơn hàng đang được giao",
            "shipping" => "Đơn hàng đang được giao",
            "delivered" => "Đã giao hàng thành công",
            "Delivered" => "Đã giao hàng thành công",
            _ => status
        };
    }

    #endregion

    #region Supplier Operations

    public async Task<SupplierShipmentResponseDto> CreateSupplierShipmentAsync(int supplierId, CreateSupplierShipmentDto dto)
    {
        var supplier = await _context.Suppliers.FindAsync(supplierId);
        if (supplier == null)
            throw new InvalidOperationException("Supplier not found");

        var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);
        if (warehouse == null)
            throw new InvalidOperationException("Warehouse not found");

        var shipment = new SupplierShipment
        {
            Id = Guid.NewGuid(),
            ExternalReference = $"SHIP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            SupplierId = supplierId,
            WarehouseId = dto.WarehouseId,
            Status = ShipmentStatus.Preparing,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            Carrier = dto.Carrier,
            TrackingNumber = dto.TrackingNumber,
            Notes = dto.Notes,
            TotalItems = dto.Items.Count,
            TotalQuantity = dto.Items.Sum(i => i.Quantity),
            CreatedAt = DateTime.UtcNow
        };

        // Add items
        decimal totalValue = 0;
        foreach (var itemDto in dto.Items)
        {
            var product = await _context.Products.FindAsync(itemDto.ProductId);
            if (product == null) continue;

            var item = new ShipmentItem
            {
                Id = Guid.NewGuid(),
                ShipmentId = shipment.Id,
                ProductId = itemDto.ProductId,
                ExpectedQuantity = itemDto.Quantity,
                BatchNumber = itemDto.BatchNumber,
                ExpiryDate = itemDto.ExpiryDate,
                UnitCost = itemDto.UnitCost ?? product.Price,
                CreatedAt = DateTime.UtcNow
            };
            totalValue += (item.UnitCost ?? 0) * item.ExpectedQuantity;
            shipment.Items.Add(item);
        }
        shipment.TotalValue = totalValue;

        // Add initial status history
        shipment.StatusHistory.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Status = ShipmentStatus.Preparing,
            Notes = "Đơn hàng được tạo bởi nhà cung cấp",
            CreatedAt = DateTime.UtcNow
        });

        _context.SupplierShipments.Add(shipment);
        await _context.SaveChangesAsync();

        return await GetSupplierShipmentDetailAsync(supplierId, shipment.Id) 
            ?? throw new InvalidOperationException("Failed to retrieve created shipment");
    }

    /// <summary>
    /// Supplier starts delivering shipment (Preparing → Delivering)
    /// </summary>
    public async Task<SupplierShipmentResponseDto> SubmitShipmentForApprovalAsync(int supplierId, Guid shipmentId)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == shipmentId && s.SupplierId == supplierId);

        if (shipment == null)
            throw new InvalidOperationException("Shipment not found");

        if (shipment.Status != ShipmentStatus.Preparing)
            throw new InvalidOperationException($"Cannot start delivering shipment in '{shipment.Status}' status. Must be 'Preparing'.");

        if (!shipment.Items.Any())
            throw new InvalidOperationException("Cannot deliver shipment without items.");

        var oldStatus = shipment.Status;
        shipment.Status = ShipmentStatus.Delivering;
        shipment.ActualDispatchDate = DateTime.UtcNow;
        shipment.UpdatedAt = DateTime.UtcNow;

        // Add status history
        shipment.StatusHistory.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            PreviousStatus = oldStatus,
            NewStatus = ShipmentStatus.Delivering,
            Notes = "Nhà cung cấp bắt đầu giao hàng",
            CreatedAt = DateTime.UtcNow
        });

        // Notify warehouse staff about incoming delivery
        var supplier = await _context.Suppliers.FindAsync(supplierId);
        await NotificationHelper.NotifyIncomingDeliveryAsync(_context, shipment, supplier?.StoreName ?? "Supplier");

        await _context.SaveChangesAsync();

        return await GetSupplierShipmentDetailAsync(supplierId, shipmentId)
            ?? throw new InvalidOperationException("Failed to retrieve shipment");
    }

    public async Task<SupplierShipmentResponseDto> UpdateSupplierShipmentStatusAsync(int supplierId, Guid shipmentId, UpdateSupplierShipmentStatusDto dto)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == shipmentId && s.SupplierId == supplierId);

        if (shipment == null)
            throw new InvalidOperationException("Shipment not found");

        // Parse and validate status
        if (Enum.TryParse<ShipmentStatus>(dto.Status, out var newStatus))
        {
            // Validate status transition
            var validTransitions = new Dictionary<ShipmentStatus, ShipmentStatus[]>
            {
                { ShipmentStatus.Preparing, new[] { ShipmentStatus.Delivering, ShipmentStatus.Cancelled } },
                { ShipmentStatus.Delivering, new[] { ShipmentStatus.Cancelled } }
            };

            if (validTransitions.TryGetValue(shipment.Status, out var allowed) && !allowed.Contains(newStatus))
                throw new InvalidOperationException($"Cannot transition from '{shipment.Status}' to '{newStatus}'.");

            var oldStatus = shipment.Status;
            shipment.Status = newStatus;
            
            if (newStatus == ShipmentStatus.Delivering)
            {
                shipment.ActualDispatchDate = DateTime.UtcNow;

                // Notify warehouse staff about incoming delivery
                var supplier = await _context.Suppliers.FindAsync(supplierId);
                await NotificationHelper.NotifyIncomingDeliveryAsync(_context, shipment, supplier?.StoreName ?? "Supplier");
            }
        }

        if (!string.IsNullOrEmpty(dto.TrackingNumber))
            shipment.TrackingNumber = dto.TrackingNumber;

        if (!string.IsNullOrEmpty(dto.Carrier))
            shipment.Carrier = dto.Carrier;

        shipment.UpdatedAt = DateTime.UtcNow;

        // Add status history
        shipment.StatusHistory.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Status = shipment.Status,
            Notes = dto.Notes ?? $"Trạng thái cập nhật: {GetStatusLabel(dto.Status)}",
            Location = dto.CurrentLocation,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return await GetSupplierShipmentDetailAsync(supplierId, shipmentId)
            ?? throw new InvalidOperationException("Failed to retrieve updated shipment");
    }

    public async Task<List<SupplierShipmentResponseDto>> GetSupplierShipmentsAsync(int supplierId, string? status = null, int page = 1, int pageSize = 20)
    {
        var query = _context.SupplierShipments
            .Include(s => s.Warehouse)
            .Include(s => s.Items)
                .ThenInclude(i => i.Product)
            .Include(s => s.StatusHistory)
            .Where(s => s.SupplierId == supplierId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ShipmentStatus>(status, out var statusEnum))
        {
            query = query.Where(s => s.Status == statusEnum);
        }

        var shipments = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return shipments.Select(MapToSupplierShipmentResponse).ToList();
    }

    public async Task<SupplierShipmentResponseDto?> GetSupplierShipmentDetailAsync(int supplierId, Guid shipmentId)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Supplier)
            .Include(s => s.Warehouse)
            .Include(s => s.Items)
                .ThenInclude(i => i.Product)
            .Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == shipmentId && s.SupplierId == supplierId);

        return shipment == null ? null : MapToSupplierShipmentResponse(shipment);
    }

    private SupplierShipmentResponseDto MapToSupplierShipmentResponse(SupplierShipment shipment)
    {
        return new SupplierShipmentResponseDto
        {
            Id = shipment.Id,
            ExternalReference = shipment.ExternalReference,
            SupplierId = shipment.SupplierId,
            SupplierName = shipment.Supplier?.StoreName ?? shipment.Supplier?.BusinessName ?? "",
            WarehouseId = shipment.WarehouseId,
            WarehouseName = shipment.Warehouse?.Name ?? "",
            Status = shipment.Status.ToString(),
            StatusLabel = GetStatusLabel(shipment.Status.ToString()),
            ExpectedDeliveryDate = shipment.ExpectedDeliveryDate,
            ActualDeliveryDate = shipment.ActualArrivalDate,
            TrackingNumber = shipment.TrackingNumber,
            Carrier = shipment.Carrier,
            TotalItems = shipment.TotalItems,
            TotalValue = shipment.TotalValue ?? 0,
            CreatedAt = shipment.CreatedAt,
            UpdatedAt = shipment.UpdatedAt,
            Timeline = shipment.StatusHistory
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new ShippingTimelineDto
                {
                    Id = h.Id,
                    Timestamp = h.CreatedAt,
                    Status = h.Status.ToString(),
                    StatusLabel = GetStatusLabel(h.Status.ToString()),
                    Description = h.Notes ?? GetTimelineDescription(h.Status.ToString()),
                    Location = h.Location,
                    Handler = h.ChangedByUser?.FullName
                })
                .ToList(),
            Items = shipment.Items.Select(i => new SupplierShipmentItemResponseDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? "",
                ProductSku = i.Product?.Sku,
                ProductImage = i.Product?.ImageUrl,
                Quantity = i.ExpectedQuantity,
                ReceivedQuantity = i.ReceivedQuantity,
                BatchNumber = i.BatchNumber,
                ExpiryDate = i.ExpiryDate,
                UnitCost = i.UnitCost ?? 0
            }).ToList()
        };
    }

    #endregion

    #region Staff Inbound Operations

    public async Task<StaffInboundSummaryDto> GetStaffInboundSummaryAsync(Guid? warehouseId = null)
    {
        var today = DateTime.UtcNow.Date;
        var query = _context.SupplierShipments
            .Include(s => s.Supplier)
            .Include(s => s.Warehouse)
            .Include(s => s.Items)
            .AsQueryable();

        if (warehouseId.HasValue)
        {
            query = query.Where(s => s.WarehouseId == warehouseId.Value);
        }

        var pendingShipments = await query
            .Where(s => s.Status == ShipmentStatus.Delivering)
            .OrderBy(s => s.ExpectedDeliveryDate)
            .Take(10)
            .ToListAsync();

        return new StaffInboundSummaryDto
        {
            TotalPendingShipments = await query.CountAsync(s => s.Status == ShipmentStatus.Delivering),
            TotalArrivedToday = await query.CountAsync(s => s.ActualArrivalDate != null && s.ActualArrivalDate.Value.Date == today),
            TotalInspecting = await query.CountAsync(s => s.Status == ShipmentStatus.Received),
            TotalStoredToday = await query.CountAsync(s => s.Status == ShipmentStatus.Success && s.UpdatedAt != null && s.UpdatedAt.Value.Date == today),
            PendingShipments = pendingShipments.Select(MapToSupplierShipmentResponse).ToList()
        };
    }

    public async Task<SupplierShipmentResponseDto> MarkShipmentArrivedAsync(Guid shipmentId, string staffId)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

        if (shipment == null)
            throw new InvalidOperationException("Shipment not found");

        shipment.Status = ShipmentStatus.Received;
        shipment.ActualArrivalDate = DateTime.UtcNow;
        shipment.UpdatedAt = DateTime.UtcNow;

        shipment.StatusHistory.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Status = ShipmentStatus.Received,
            Notes = "Hàng đã đến kho",
            ChangedBy = Guid.TryParse(staffId, out var guid) ? guid : null,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return await GetSupplierShipmentDetailAsync(shipment.SupplierId, shipmentId)
            ?? throw new InvalidOperationException("Failed to retrieve shipment");
    }

    public async Task<SupplierShipmentResponseDto> ReceiveShipmentAsync(StaffReceiveShipmentDto dto, string staffId)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == dto.ShipmentId);

        if (shipment == null)
            throw new InvalidOperationException("Shipment not found");

        // Update items with received quantities
        foreach (var receivedItem in dto.Items)
        {
            var item = shipment.Items.FirstOrDefault(i => i.Id == receivedItem.ItemId);
            if (item != null)
            {
                item.ReceivedQuantity = receivedItem.AcceptedQuantity;
                item.DamagedQuantity = receivedItem.DamagedQuantity;
                item.Notes = receivedItem.Notes;
                item.UpdatedAt = DateTime.UtcNow;
            }
        }

        shipment.Status = ShipmentStatus.Received;
        shipment.UpdatedAt = DateTime.UtcNow;

        shipment.StatusHistory.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Status = ShipmentStatus.Received,
            Notes = dto.Notes ?? "Đã kiểm tra và nhận hàng",
            ChangedBy = Guid.TryParse(staffId, out var guid) ? guid : null,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return await GetSupplierShipmentDetailAsync(shipment.SupplierId, dto.ShipmentId)
            ?? throw new InvalidOperationException("Failed to retrieve shipment");
    }

    public async Task<bool> StoreItemsToInventoryAsync(Guid shipmentId, string staffId)
    {
        var shipment = await _context.SupplierShipments
            .Include(s => s.Items)
            .Include(s => s.StatusHistory)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

        if (shipment == null)
            throw new InvalidOperationException("Shipment not found");

        // Add items to warehouse inventory
        foreach (var item in shipment.Items.Where(i => i.ReceivedQuantity > 0))
        {
            var inventory = new WarehouseInventory
            {
                Id = Guid.NewGuid(),
                WarehouseId = shipment.WarehouseId,
                ProductId = item.ProductId,
                BatchNumber = item.BatchNumber,
                ExpiryDate = item.ExpiryDate,
                Quantity = item.ReceivedQuantity ?? item.ExpectedQuantity,
                AvailableQuantity = item.ReceivedQuantity ?? item.ExpectedQuantity,
                ReservedQuantity = 0,
                UnitCost = item.UnitCost,
                Type = InventoryType.Available,
                ReceivedAt = DateTime.UtcNow,
                SourceShipmentId = shipment.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.WarehouseInventories.Add(inventory);
        }

        shipment.Status = ShipmentStatus.Success;
        shipment.UpdatedAt = DateTime.UtcNow;

        shipment.StatusHistory.Add(new ShipmentStatusHistory
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Status = ShipmentStatus.Success,
            Notes = "Hàng đã được lưu vào kho",
            ChangedBy = Guid.TryParse(staffId, out var guid) ? guid : null,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Staff Outbound Operations

    public async Task<StaffOutboundSummaryDto> GetStaffOutboundSummaryAsync(Guid? warehouseId = null)
    {
        var today = DateTime.UtcNow.Date;
        var query = _context.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderStatusHistories)
            .AsQueryable();

        var pendingStatuses = new[] { OrderStatus.pending, OrderStatus.confirmed };

        var pendingOrders = await query
            .Where(o => pendingStatuses.Contains(o.Status))
            .OrderBy(o => o.CreatedAt)
            .Take(10)
            .ToListAsync();

        return new StaffOutboundSummaryDto
        {
            TotalPendingOrders = await query.CountAsync(o => o.Status == OrderStatus.pending),
            TotalPreparingOrders = await query.CountAsync(o => o.Status == OrderStatus.confirmed),
            TotalPackedOrders = 0, // Would need additional status
            TotalOutForDelivery = await query.CountAsync(o => o.Status == OrderStatus.shipping),
            TotalDeliveredToday = await query.CountAsync(o => o.Status == OrderStatus.delivered && o.UpdatedAt != null && o.UpdatedAt.Value.Date == today),
            PendingOrders = pendingOrders.Select(MapToStaffOutboundOrder).ToList()
        };
    }

    public async Task<List<StaffOutboundOrderDto>> GetPendingOrdersAsync(Guid? warehouseId = null, int page = 1, int pageSize = 20)
    {
        var pendingStatuses = new[] { OrderStatus.pending, OrderStatus.confirmed };

        var orders = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderStatusHistories)
            .Where(o => pendingStatuses.Contains(o.Status))
            .OrderBy(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return orders.Select(MapToStaffOutboundOrder).ToList();
    }

    public async Task<StaffOutboundOrderDto> PickOrderItemsAsync(StaffPickItemsDto dto, string staffId)
    {
        // Implementation for picking items from inventory
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        // Reserve inventory items
        foreach (var pickedItem in dto.Items)
        {
            var inventory = await _context.WarehouseInventories
                .FirstOrDefaultAsync(i => i.Id == pickedItem.InventoryItemId);

            if (inventory != null && inventory.AvailableQuantity >= pickedItem.Quantity)
            {
                inventory.AvailableQuantity -= pickedItem.Quantity;
                inventory.ReservedQuantity += pickedItem.Quantity;
                inventory.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return await GetOutboundOrderDetailAsync(dto.OrderId) 
            ?? throw new InvalidOperationException("Failed to retrieve order");
    }

    public async Task<StaffOutboundOrderDto> UpdateOrderShippingStatusAsync(StaffUpdateOrderShippingDto dto, string staffId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        // Update order status based on shipping status
        var newStatus = dto.Status switch
        {
            "StaffPreparing" => OrderStatus.confirmed,
            "StaffPacked" => OrderStatus.confirmed,
            "OutForDelivery" or "InTransitToUser" => OrderStatus.shipping,
            "Delivered" => OrderStatus.delivered,
            "DeliveryFailed" => OrderStatus.pending,
            _ => order.Status
        };

        order.Status = newStatus;
        if (!string.IsNullOrEmpty(dto.TrackingNumber))
            order.TrackingNumber = dto.TrackingNumber;
        if (!string.IsNullOrEmpty(dto.ShippingProvider))
            order.ShippingProvider = dto.ShippingProvider;
        order.UpdatedAt = DateTime.UtcNow;

        // Add status history
        order.OrderStatusHistories.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = newStatus,
            Note = dto.Notes ?? $"Trạng thái vận chuyển: {GetStatusLabel(dto.Status)}",
            ChangedAt = DateTime.UtcNow,
            ChangedBy = staffId
        });

        await _context.SaveChangesAsync();
        return await GetOutboundOrderDetailAsync(dto.OrderId) 
            ?? throw new InvalidOperationException("Failed to retrieve order");
    }

    public async Task<StaffOutboundOrderDto?> GetOutboundOrderDetailAsync(Guid orderId)
    {
        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        return order == null ? null : MapToStaffOutboundOrder(order);
    }

    private StaffOutboundOrderDto MapToStaffOutboundOrder(Order order)
    {
        return new StaffOutboundOrderDto
        {
            OrderId = order.Id,
            OrderNumber = order.Id.ToString()[..8].ToUpper(),
            UserId = order.UserId ?? Guid.Empty,
            CustomerName = order.User?.FullName ?? "N/A",
            CustomerPhone = order.User?.PhoneNumber ?? "N/A",
            CustomerEmail = order.User?.Email ?? "N/A",
            ShippingAddress = order.ShippingAddressSnapshot ?? "",
            Status = order.Status.ToString(),
            StatusLabel = GetStatusLabel(order.Status.ToString()),
            ShippingStatus = order.Status.ToString(),
            ShippingStatusLabel = GetStatusLabel(order.Status.ToString()),
            TotalAmount = order.TotalAmount,
            OrderDate = order.CreatedAt ?? DateTime.UtcNow,
            TrackingNumber = order.TrackingNumber,
            ShippingProvider = order.ShippingProvider,
            Items = order.OrderItems.Select(oi => new StaffOutboundItemDto
            {
                OrderItemId = oi.Id,
                ProductId = oi.ProductId ?? Guid.Empty,
                ProductName = oi.Product?.Name ?? "",
                ProductSku = oi.Product?.Sku,
                ProductImage = oi.Product?.ImageUrl,
                Quantity = oi.Quantity,
                Price = oi.Price
            }).ToList(),
            Timeline = order.OrderStatusHistories
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new ShippingTimelineDto
                {
                    Id = h.Id,
                    Timestamp = h.ChangedAt ?? DateTime.UtcNow,
                    Status = h.Status.ToString(),
                    StatusLabel = GetStatusLabel(h.Status.ToString()),
                    Description = h.Note ?? GetTimelineDescription(h.Status.ToString()),
                    Handler = h.ChangedBy
                })
                .ToList()
        };
    }

    #endregion

    #region User Operations

    public async Task<UserOrderTrackingDto?> GetUserOrderTrackingAsync(Guid userId, Guid orderId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        return order == null ? null : MapToUserOrderTracking(order);
    }

    public async Task<List<UserOrderTrackingDto>> GetUserOrdersTrackingAsync(Guid userId, string? status = null, int page = 1, int pageSize = 20)
    {
        var query = _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderStatusHistories)
            .Where(o => o.UserId == userId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, out var statusEnum))
        {
            query = query.Where(o => o.Status == statusEnum);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return orders.Select(MapToUserOrderTracking).ToList();
    }

    public async Task<UserOrderTrackingDto> UserConfirmDeliveryAsync(UserConfirmDeliveryDto dto, Guid userId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.UserId == userId);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        if (dto.IsReceived)
        {
            order.Status = OrderStatus.delivered;
            order.UpdatedAt = DateTime.UtcNow;

            order.OrderStatusHistories.Add(new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                Status = OrderStatus.delivered,
                Note = "Khách hàng xác nhận đã nhận hàng" + (dto.Feedback != null ? $": {dto.Feedback}" : ""),
                ChangedAt = DateTime.UtcNow,
                ChangedBy = userId.ToString()
            });

            await _context.SaveChangesAsync();
        }

        return await GetUserOrderTrackingAsync(userId, dto.OrderId) 
            ?? throw new InvalidOperationException("Failed to retrieve order");
    }

    public async Task<UserOrderTrackingDto> UserRequestReturnAsync(UserRequestReturnDto dto, Guid userId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.UserId == userId);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        if (order.Status != OrderStatus.delivered)
            throw new InvalidOperationException("Chỉ có thể yêu cầu trả hàng khi đơn hàng đã được giao");

        order.Status = OrderStatus.returned;
        order.UpdatedAt = DateTime.UtcNow;

        order.OrderStatusHistories.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = OrderStatus.returned,
            Note = $"Yêu cầu trả hàng: {dto.Reason}" + (dto.Description != null ? $" - {dto.Description}" : ""),
            ChangedAt = DateTime.UtcNow,
            ChangedBy = userId.ToString()
        });

        await _context.SaveChangesAsync();

        return await GetUserOrderTrackingAsync(userId, dto.OrderId) 
            ?? throw new InvalidOperationException("Failed to retrieve order");
    }

    public async Task<UserOrderTrackingDto> UserCancelOrderAsync(Guid orderId, Guid userId, string reason)
    {
        var order = await _context.Orders
            .Include(o => o.OrderStatusHistories)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        if (order.Status != OrderStatus.pending)
            throw new InvalidOperationException("Chỉ có thể hủy đơn hàng khi đang ở trạng thái chờ xử lý");

        order.Status = OrderStatus.cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        order.OrderStatusHistories.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = OrderStatus.cancelled,
            Note = $"Khách hàng hủy đơn: {reason}",
            ChangedAt = DateTime.UtcNow,
            ChangedBy = userId.ToString()
        });

        await _context.SaveChangesAsync();

        return await GetUserOrderTrackingAsync(userId, orderId) 
            ?? throw new InvalidOperationException("Failed to retrieve order");
    }

    private UserOrderTrackingDto MapToUserOrderTracking(Order order)
    {
        var canCancel = order.Status == OrderStatus.pending;
        var canRequestReturn = order.Status == OrderStatus.delivered;
        var canConfirm = order.Status == OrderStatus.shipping;

        return new UserOrderTrackingDto
        {
            OrderId = order.Id,
            OrderNumber = order.Id.ToString()[..8].ToUpper(),
            Status = order.Status.ToString(),
            StatusLabel = GetStatusLabel(order.Status.ToString()),
            ShippingStatus = order.Status.ToString(),
            ShippingStatusLabel = GetStatusLabel(order.Status.ToString()),
            StatusProgress = CalculateProgress(order.Status.ToString()),
            TotalAmount = order.TotalAmount,
            OrderDate = order.CreatedAt ?? DateTime.UtcNow,
            TrackingNumber = order.TrackingNumber,
            ShippingProvider = order.ShippingProvider,
            ShippingAddress = order.ShippingAddressSnapshot ?? "",
            CanCancel = canCancel,
            CanRequestReturn = canRequestReturn,
            CanConfirmReceived = canConfirm,
            Items = order.OrderItems.Select(oi => new UserOrderItemDto
            {
                ProductId = oi.ProductId ?? Guid.Empty,
                ProductName = oi.Product?.Name ?? "",
                ProductImage = oi.Product?.ImageUrl,
                Quantity = oi.Quantity,
                Price = oi.Price
            }).ToList(),
            Timeline = order.OrderStatusHistories
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new ShippingTimelineDto
                {
                    Id = h.Id,
                    Timestamp = h.ChangedAt ?? DateTime.UtcNow,
                    Status = h.Status.ToString(),
                    StatusLabel = GetStatusLabel(h.Status.ToString()),
                    Description = h.Note ?? GetTimelineDescription(h.Status.ToString())
                })
                .ToList()
        };
    }

    #endregion

    #region Dashboard

    public async Task<StaffShippingDashboardDto> GetStaffShippingDashboardAsync(Guid? warehouseId = null)
    {
        var inbound = await GetStaffInboundSummaryAsync(warehouseId);
        var outbound = await GetStaffOutboundSummaryAsync(warehouseId);

        var alerts = new List<ShippingAlertDto>();

        // Check for late deliveries
        var lateShipments = await _context.SupplierShipments
            .Where(s => s.ExpectedDeliveryDate < DateTime.UtcNow && 
                        s.Status != ShipmentStatus.Received && 
                        s.Status != ShipmentStatus.Success &&
                        s.Status != ShipmentStatus.Cancelled)
            .ToListAsync();

        foreach (var shipment in lateShipments)
        {
            alerts.Add(new ShippingAlertDto
            {
                Type = "late_delivery",
                Severity = "high",
                Message = $"Lô hàng {shipment.ExternalReference} đã quá hạn giao",
                RelatedEntityId = shipment.Id,
                RelatedEntityType = "Shipment",
                CreatedAt = DateTime.UtcNow
            });
        }

        return new StaffShippingDashboardDto
        {
            Inbound = inbound,
            Outbound = outbound,
            TotalActiveShipments = inbound.TotalPendingShipments + outbound.TotalPreparingOrders + outbound.TotalOutForDelivery,
            AlertsCount = alerts.Count,
            Alerts = alerts
        };
    }

    #endregion
}
