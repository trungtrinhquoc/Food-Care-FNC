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

public class InventoryService : IInventoryService
{
    private readonly FoodCareDbContext _context;

    public InventoryService(FoodCareDbContext context)
    {
        _context = context;
    }

    // =====================================================
    // INVENTORY QUERY
    // =====================================================

    public async Task<PagedResponse<WarehouseInventoryDto>> GetInventoryAsync(
        int page, int pageSize, Guid? warehouseId, Guid? productId, 
        string? inventoryType, bool? lowStock, bool? nearExpiry)
    {
        var query = _context.WarehouseInventories
            .Include(i => i.Warehouse)
            .Include(i => i.Product)
            .AsQueryable();

        if (warehouseId.HasValue)
            query = query.Where(i => i.WarehouseId == warehouseId.Value);

        if (productId.HasValue)
            query = query.Where(i => i.ProductId == productId.Value);

        if (!string.IsNullOrEmpty(inventoryType))
        {
            if (Enum.TryParse<InventoryType>(inventoryType, true, out var type))
                query = query.Where(i => i.InventoryType == type);
        }

        if (lowStock == true)
            query = query.Where(i => i.Quantity <= i.MinStockLevel && i.MinStockLevel > 0);

        if (nearExpiry == true)
        {
            var expiryThreshold = DateTime.UtcNow.AddDays(30);
            query = query.Where(i => i.ExpiryDate.HasValue && i.ExpiryDate <= expiryThreshold);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(i => i.ExpiryDate ?? DateTime.MaxValue)
            .ThenBy(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<WarehouseInventoryDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<WarehouseInventoryDto?> GetInventoryByIdAsync(Guid id)
    {
        var inventory = await _context.WarehouseInventories
            .Include(i => i.Warehouse)
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.Id == id);

        return inventory != null ? MapToDto(inventory) : null;
    }

    public async Task<IEnumerable<WarehouseInventoryDto>> GetInventoryByProductAsync(Guid productId)
    {
        var inventory = await _context.WarehouseInventories
            .Include(i => i.Warehouse)
            .Include(i => i.Product)
            .Where(i => i.ProductId == productId && i.InventoryType == InventoryType.Available)
            .OrderBy(i => i.ExpiryDate ?? DateTime.MaxValue)
            .ToListAsync();

        return inventory.Select(MapToDto);
    }

    public async Task<int> GetAvailableQuantityAsync(Guid productId, Guid? warehouseId)
    {
        var query = _context.WarehouseInventories
            .Where(i => i.ProductId == productId && i.InventoryType == InventoryType.Available);

        if (warehouseId.HasValue)
            query = query.Where(i => i.WarehouseId == warehouseId.Value);

        return await query.SumAsync(i => i.Quantity - i.ReservedQuantity);
    }

    public async Task<IEnumerable<WarehouseInventoryDto>> GetExpiringInventoryAsync(int days, Guid? warehouseId)
    {
        var expiryThreshold = DateTime.UtcNow.AddDays(days);
        
        var query = _context.WarehouseInventories
            .Include(i => i.Warehouse)
            .Include(i => i.Product)
            .Where(i => i.ExpiryDate.HasValue && 
                       i.ExpiryDate <= expiryThreshold && 
                       i.InventoryType == InventoryType.Available &&
                       i.Quantity > 0);

        if (warehouseId.HasValue)
            query = query.Where(i => i.WarehouseId == warehouseId.Value);

        var inventory = await query.OrderBy(i => i.ExpiryDate).ToListAsync();
        return inventory.Select(MapToDto);
    }

    public async Task<IEnumerable<WarehouseInventoryDto>> GetLowStockInventoryAsync(Guid? warehouseId)
    {
        var query = _context.WarehouseInventories
            .Include(i => i.Warehouse)
            .Include(i => i.Product)
            .Where(i => i.MinStockLevel > 0 && i.Quantity <= i.MinStockLevel);

        if (warehouseId.HasValue)
            query = query.Where(i => i.WarehouseId == warehouseId.Value);

        var inventory = await query.ToListAsync();
        return inventory.Select(MapToDto);
    }

    // =====================================================
    // INVENTORY MANAGEMENT
    // =====================================================

    public async Task AddToInventoryAsync(AddToInventoryRequest request)
    {
        // Check if we can merge with existing inventory (same product, batch, expiry, warehouse, type)
        var existing = await _context.WarehouseInventories.FirstOrDefaultAsync(i =>
            i.ProductId == request.ProductId &&
            i.WarehouseId == request.WarehouseId &&
            i.BatchNumber == request.BatchNumber &&
            i.ExpiryDate == request.ExpiryDate &&
            i.InventoryType == request.InventoryType);

        if (existing != null)
        {
            existing.Quantity += request.Quantity;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.Version++;

            // Record movement
            await RecordMovementAsync(new StockMovement
            {
                Id = Guid.NewGuid(),
                InventoryId = existing.Id,
                MovementType = MovementType.Inbound,
                QuantityChange = request.Quantity,
                QuantityBefore = existing.Quantity - request.Quantity,
                QuantityAfter = existing.Quantity,
                ReferenceType = "receipt",
                ReferenceId = request.ReceiptId,
                PerformedBy = request.StaffId,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            var newInventory = new WarehouseInventory
            {
                Id = Guid.NewGuid(),
                ProductId = request.ProductId,
                WarehouseId = request.WarehouseId,
                Quantity = request.Quantity,
                ReservedQuantity = 0,
                BatchNumber = request.BatchNumber,
                ExpiryDate = request.ExpiryDate,
                UnitCost = request.UnitCost,
                InventoryType = request.InventoryType,
                Version = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.WarehouseInventories.Add(newInventory);
            await _context.SaveChangesAsync();

            await RecordMovementAsync(new StockMovement
            {
                Id = Guid.NewGuid(),
                InventoryId = newInventory.Id,
                MovementType = MovementType.Inbound,
                QuantityChange = request.Quantity,
                QuantityBefore = 0,
                QuantityAfter = request.Quantity,
                ReferenceType = "receipt",
                ReferenceId = request.ReceiptId,
                PerformedBy = request.StaffId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task<WarehouseInventoryDto?> AdjustInventoryAsync(Guid id, AdjustInventoryRequest request, Guid staffId)
    {
        var inventory = await _context.WarehouseInventories.FindAsync(id);
        if (inventory == null) return null;

        // Optimistic locking check
        if (request.ExpectedVersion.HasValue && inventory.Version != request.ExpectedVersion.Value)
            throw new InvalidOperationException("Inventory has been modified. Please refresh and try again.");

        var quantityBefore = inventory.Quantity;
        inventory.Quantity += request.QuantityChange;
        inventory.UpdatedAt = DateTime.UtcNow;
        inventory.Version++;

        if (inventory.Quantity < 0)
            throw new InvalidOperationException("Adjustment would result in negative inventory");

        await RecordMovementAsync(new StockMovement
        {
            Id = Guid.NewGuid(),
            InventoryId = inventory.Id,
            MovementType = MovementType.Adjustment,
            QuantityChange = request.QuantityChange,
            QuantityBefore = quantityBefore,
            QuantityAfter = inventory.Quantity,
            ReferenceType = "adjustment",
            Notes = $"{request.Reason}: {request.Notes}",
            PerformedBy = staffId,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return await GetInventoryByIdAsync(id);
    }

    public async Task TransferInventoryAsync(TransferInventoryRequest request, Guid staffId)
    {
        var source = await _context.WarehouseInventories.FindAsync(request.SourceInventoryId);
        if (source == null)
            throw new InvalidOperationException("Source inventory not found");

        var available = source.Quantity - source.ReservedQuantity;
        if (request.Quantity > available)
            throw new InvalidOperationException($"Insufficient available quantity. Available: {available}");

        // Deduct from source
        source.Quantity -= request.Quantity;
        source.UpdatedAt = DateTime.UtcNow;
        source.Version++;

        await RecordMovementAsync(new StockMovement
        {
            Id = Guid.NewGuid(),
            InventoryId = source.Id,
            MovementType = MovementType.Transfer,
            QuantityChange = -request.Quantity,
            QuantityBefore = source.Quantity + request.Quantity,
            QuantityAfter = source.Quantity,
            ReferenceType = "transfer_out",
            Notes = request.Notes,
            PerformedBy = staffId,
            CreatedAt = DateTime.UtcNow
        });

        // Add to destination (or merge)
        var destination = await _context.WarehouseInventories.FirstOrDefaultAsync(i =>
            i.ProductId == source.ProductId &&
            i.WarehouseId == request.TargetWarehouseId &&
            i.BatchNumber == source.BatchNumber &&
            i.ExpiryDate == source.ExpiryDate &&
            i.InventoryType == source.InventoryType);

        if (destination != null)
        {
            destination.Quantity += request.Quantity;
            destination.UpdatedAt = DateTime.UtcNow;
            destination.Version++;

            await RecordMovementAsync(new StockMovement
            {
                Id = Guid.NewGuid(),
                InventoryId = destination.Id,
                MovementType = MovementType.Transfer,
                QuantityChange = request.Quantity,
                QuantityBefore = destination.Quantity - request.Quantity,
                QuantityAfter = destination.Quantity,
                ReferenceType = "transfer_in",
                Notes = request.Notes,
                PerformedBy = staffId,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            var newInventory = new WarehouseInventory
            {
                Id = Guid.NewGuid(),
                ProductId = source.ProductId,
                WarehouseId = request.TargetWarehouseId,
                Quantity = request.Quantity,
                ReservedQuantity = 0,
                BatchNumber = source.BatchNumber,
                ExpiryDate = source.ExpiryDate,
                UnitCost = source.UnitCost,
                InventoryType = source.InventoryType,
                Version = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.WarehouseInventories.Add(newInventory);
            await _context.SaveChangesAsync();

            await RecordMovementAsync(new StockMovement
            {
                Id = Guid.NewGuid(),
                InventoryId = newInventory.Id,
                MovementType = MovementType.Transfer,
                QuantityChange = request.Quantity,
                QuantityBefore = 0,
                QuantityAfter = request.Quantity,
                ReferenceType = "transfer_in",
                Notes = request.Notes,
                PerformedBy = staffId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task<WarehouseInventoryDto?> QuarantineInventoryAsync(Guid id, QuarantineInventoryRequest request, Guid staffId)
    {
        var inventory = await _context.WarehouseInventories.FindAsync(id);
        if (inventory == null) return null;

        var available = inventory.Quantity - inventory.ReservedQuantity;
        if (request.Quantity > available)
            throw new InvalidOperationException($"Insufficient available quantity. Available: {available}");

        // Deduct from original
        inventory.Quantity -= request.Quantity;
        inventory.UpdatedAt = DateTime.UtcNow;
        inventory.Version++;

        await RecordMovementAsync(new StockMovement
        {
            Id = Guid.NewGuid(),
            InventoryId = inventory.Id,
            MovementType = MovementType.QuarantineOut,
            QuantityChange = -request.Quantity,
            QuantityBefore = inventory.Quantity + request.Quantity,
            QuantityAfter = inventory.Quantity,
            Notes = request.Reason,
            PerformedBy = staffId,
            CreatedAt = DateTime.UtcNow
        });

        // Create quarantine record
        var quarantine = new WarehouseInventory
        {
            Id = Guid.NewGuid(),
            ProductId = inventory.ProductId,
            WarehouseId = inventory.WarehouseId,
            Quantity = request.Quantity,
            ReservedQuantity = 0,
            BatchNumber = inventory.BatchNumber,
            ExpiryDate = inventory.ExpiryDate,
            UnitCost = inventory.UnitCost,
            InventoryType = InventoryType.Quarantine,
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.WarehouseInventories.Add(quarantine);
        await _context.SaveChangesAsync();

        await RecordMovementAsync(new StockMovement
        {
            Id = Guid.NewGuid(),
            InventoryId = quarantine.Id,
            MovementType = MovementType.QuarantineIn,
            QuantityChange = request.Quantity,
            QuantityBefore = 0,
            QuantityAfter = request.Quantity,
            Notes = request.Reason,
            PerformedBy = staffId,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return await GetInventoryByIdAsync(id);
    }

    public async Task<WarehouseInventoryDto?> MarkExpiredAsync(Guid id, MarkExpiredRequest request, Guid staffId)
    {
        var inventory = await _context.WarehouseInventories.FindAsync(id);
        if (inventory == null) return null;

        var quantityBefore = inventory.Quantity;
        
        // Record movement before changing type
        await RecordMovementAsync(new StockMovement
        {
            Id = Guid.NewGuid(),
            InventoryId = inventory.Id,
            MovementType = MovementType.Expired,
            QuantityChange = -quantityBefore,
            QuantityBefore = quantityBefore,
            QuantityAfter = 0,
            Notes = request.Notes,
            PerformedBy = staffId,
            CreatedAt = DateTime.UtcNow
        });

        inventory.InventoryType = InventoryType.Expired;
        inventory.UpdatedAt = DateTime.UtcNow;
        inventory.Version++;

        await _context.SaveChangesAsync();
        return await GetInventoryByIdAsync(id);
    }

    // =====================================================
    // STOCK MOVEMENTS
    // =====================================================

    public async Task<PagedResponse<StockMovementDto>> GetMovementsAsync(
        int page, int pageSize, Guid? inventoryId, string? movementType, DateTime? from, DateTime? to)
    {
        var query = _context.StockMovements
            .Include(m => m.Inventory)
                .ThenInclude(i => i.Product)
            .Include(m => m.PerformedByStaff)
                .ThenInclude(s => s.User)
            .AsQueryable();

        if (inventoryId.HasValue)
            query = query.Where(m => m.InventoryId == inventoryId.Value);

        if (!string.IsNullOrEmpty(movementType))
        {
            if (Enum.TryParse<MovementType>(movementType, true, out var type))
                query = query.Where(m => m.MovementType == type);
        }

        if (from.HasValue)
            query = query.Where(m => m.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(m => m.CreatedAt <= to.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<StockMovementDto>
        {
            Items = items.Select(MapMovementToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<IEnumerable<StockMovementDto>> GetMovementsByInventoryIdAsync(Guid inventoryId)
    {
        var movements = await _context.StockMovements
            .Include(m => m.Inventory)
                .ThenInclude(i => i.Product)
            .Include(m => m.PerformedByStaff)
                .ThenInclude(s => s.User)
            .Where(m => m.InventoryId == inventoryId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        return movements.Select(MapMovementToDto);
    }

    // =====================================================
    // RESERVATIONS
    // =====================================================

    public async Task<StockReservationDto> ReserveStockAsync(ReserveStockRequest request)
    {
        // Find inventory with FIFO (oldest expiry first)
        var inventoryQuery = _context.WarehouseInventories
            .Where(i => i.ProductId == request.ProductId && 
                       i.InventoryType == InventoryType.Available &&
                       (i.Quantity - i.ReservedQuantity) > 0);

        if (request.WarehouseId.HasValue)
            inventoryQuery = inventoryQuery.Where(i => i.WarehouseId == request.WarehouseId.Value);

        var availableInventory = await inventoryQuery
            .OrderBy(i => i.ExpiryDate ?? DateTime.MaxValue)
            .ToListAsync();

        var totalAvailable = availableInventory.Sum(i => i.Quantity - i.ReservedQuantity);
        if (totalAvailable < request.Quantity)
            throw new InvalidOperationException($"Insufficient stock. Available: {totalAvailable}");

        var remainingQuantity = request.Quantity;
        var reservationId = Guid.NewGuid();
        var reservations = new List<StockReservation>();

        foreach (var inventory in availableInventory)
        {
            if (remainingQuantity <= 0) break;

            var available = inventory.Quantity - inventory.ReservedQuantity;
            var reserveQuantity = Math.Min(available, remainingQuantity);

            inventory.ReservedQuantity += reserveQuantity;
            inventory.UpdatedAt = DateTime.UtcNow;

            var reservation = new StockReservation
            {
                Id = Guid.NewGuid(),
                InventoryId = inventory.Id,
                OrderId = request.OrderId,
                Quantity = reserveQuantity,
                ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddHours(24),
                ReservedAt = DateTime.UtcNow
            };

            _context.StockReservations.Add(reservation);
            reservations.Add(reservation);

            await RecordMovementAsync(new StockMovement
            {
                Id = Guid.NewGuid(),
                InventoryId = inventory.Id,
                MovementType = MovementType.Reserved,
                QuantityChange = reserveQuantity,
                QuantityBefore = inventory.ReservedQuantity - reserveQuantity,
                QuantityAfter = inventory.ReservedQuantity,
                ReferenceType = "order",
                ReferenceId = request.OrderId,
                CreatedAt = DateTime.UtcNow
            });

            remainingQuantity -= reserveQuantity;
        }

        await _context.SaveChangesAsync();

        return new StockReservationDto
        {
            Id = reservations.First().Id,
            OrderId = request.OrderId,
            TotalQuantity = request.Quantity,
            ReservedItems = reservations.Count
        };
    }

    public async Task<bool> ReleaseReservationAsync(Guid reservationId)
    {
        var reservation = await _context.StockReservations
            .Include(r => r.Inventory)
            .FirstOrDefaultAsync(r => r.Id == reservationId);

        if (reservation == null) return false;

        reservation.Inventory.ReservedQuantity -= reservation.Quantity;
        reservation.Inventory.UpdatedAt = DateTime.UtcNow;

        await RecordMovementAsync(new StockMovement
        {
            Id = Guid.NewGuid(),
            InventoryId = reservation.InventoryId,
            MovementType = MovementType.Unreserved,
            QuantityChange = -reservation.Quantity,
            QuantityBefore = reservation.Inventory.ReservedQuantity + reservation.Quantity,
            QuantityAfter = reservation.Inventory.ReservedQuantity,
            ReferenceType = "order",
            ReferenceId = reservation.OrderId,
            CreatedAt = DateTime.UtcNow
        });

        _context.StockReservations.Remove(reservation);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task ConfirmReservationAsync(Guid reservationId, Guid staffId)
    {
        var reservation = await _context.StockReservations
            .Include(r => r.Inventory)
            .FirstOrDefaultAsync(r => r.Id == reservationId);

        if (reservation == null)
            throw new InvalidOperationException("Reservation not found");

        // Convert reservation to actual deduction
        reservation.Inventory.Quantity -= reservation.Quantity;
        reservation.Inventory.ReservedQuantity -= reservation.Quantity;
        reservation.Inventory.UpdatedAt = DateTime.UtcNow;
        reservation.Inventory.Version++;

        await RecordMovementAsync(new StockMovement
        {
            Id = Guid.NewGuid(),
            InventoryId = reservation.InventoryId,
            MovementType = MovementType.Outbound,
            QuantityChange = -reservation.Quantity,
            QuantityBefore = reservation.Inventory.Quantity + reservation.Quantity,
            QuantityAfter = reservation.Inventory.Quantity,
            ReferenceType = "order",
            ReferenceId = reservation.OrderId,
            PerformedBy = staffId,
            CreatedAt = DateTime.UtcNow
        });

        _context.StockReservations.Remove(reservation);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<StockReservationDto>> GetReservationsByOrderAsync(Guid orderId)
    {
        var reservations = await _context.StockReservations
            .Include(r => r.Inventory)
                .ThenInclude(i => i.Product)
            .Where(r => r.OrderId == orderId)
            .ToListAsync();

        return reservations.Select(r => new StockReservationDto
        {
            Id = r.Id,
            OrderId = r.OrderId,
            InventoryId = r.InventoryId,
            ProductName = r.Inventory?.Product?.Name,
            Quantity = r.Quantity,
            ExpiresAt = r.ExpiresAt
        });
    }

    // =====================================================
    // FIFO PICKING
    // =====================================================

    public async Task<IEnumerable<FifoPickDto>> GetFifoPickListAsync(PickListRequest request)
    {
        var pickList = new List<FifoPickDto>();

        foreach (var item in request.Items)
        {
            var query = _context.WarehouseInventories
                .Include(i => i.Warehouse)
                .Include(i => i.Product)
                .Where(i => i.ProductId == item.ProductId &&
                           i.InventoryType == InventoryType.Available &&
                           (i.Quantity - i.ReservedQuantity) > 0);

            if (request.WarehouseId.HasValue)
                query = query.Where(i => i.WarehouseId == request.WarehouseId.Value);

            var inventory = await query
                .OrderBy(i => i.ExpiryDate ?? DateTime.MaxValue)
                .ThenBy(i => i.CreatedAt)
                .ToListAsync();

            var remaining = item.Quantity;
            foreach (var inv in inventory)
            {
                if (remaining <= 0) break;

                var available = inv.Quantity - inv.ReservedQuantity;
                var pickQty = Math.Min(available, remaining);

                pickList.Add(new FifoPickDto
                {
                    InventoryId = inv.Id,
                    ProductId = inv.ProductId,
                    ProductName = inv.Product?.Name,
                    BatchNumber = inv.BatchNumber,
                    ExpiryDate = inv.ExpiryDate,
                    AvailableQuantity = available,
                    PickQuantity = pickQty,
                    WarehouseName = inv.Warehouse?.Name,
                    Location = inv.Location
                });

                remaining -= pickQty;
            }

            if (remaining > 0)
                throw new InvalidOperationException($"Insufficient stock for product {item.ProductId}. Short by {remaining}");
        }

        return pickList;
    }

    public async Task ExecuteFifoPickAsync(ExecutePickRequest request, Guid staffId, bool canOverride)
    {
        foreach (var item in request.Items)
        {
            var inventory = await _context.WarehouseInventories.FindAsync(item.InventoryId);
            if (inventory == null)
                throw new InvalidOperationException($"Inventory {item.InventoryId} not found");

            var available = inventory.Quantity - inventory.ReservedQuantity;
            if (item.Quantity > available)
                throw new InvalidOperationException($"Insufficient quantity in inventory {item.InventoryId}");

            // Check FIFO compliance if not overriding
            if (item.OverrideFifo && !canOverride)
                throw new InvalidOperationException("FIFO override permission required");

            inventory.Quantity -= item.Quantity;
            inventory.UpdatedAt = DateTime.UtcNow;
            inventory.Version++;

            await RecordMovementAsync(new StockMovement
            {
                Id = Guid.NewGuid(),
                InventoryId = inventory.Id,
                MovementType = MovementType.Outbound,
                QuantityChange = -item.Quantity,
                QuantityBefore = inventory.Quantity + item.Quantity,
                QuantityAfter = inventory.Quantity,
                ReferenceType = "order",
                ReferenceId = request.OrderId,
                IsFifoOverride = item.OverrideFifo,
                PerformedBy = staffId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    private async Task RecordMovementAsync(StockMovement movement)
    {
        _context.StockMovements.Add(movement);
        await _context.SaveChangesAsync();
    }

    private WarehouseInventoryDto MapToDto(WarehouseInventory inventory)
    {
        return new WarehouseInventoryDto
        {
            Id = inventory.Id,
            ProductId = inventory.ProductId,
            ProductName = inventory.Product?.Name,
            ProductSku = inventory.Product?.Sku,
            WarehouseId = inventory.WarehouseId,
            WarehouseName = inventory.Warehouse?.Name,
            Quantity = inventory.Quantity,
            ReservedQuantity = inventory.ReservedQuantity,
            AvailableQuantity = inventory.Quantity - inventory.ReservedQuantity,
            BatchNumber = inventory.BatchNumber,
            ExpiryDate = inventory.ExpiryDate,
            UnitCost = inventory.UnitCost,
            Location = inventory.Location,
            InventoryType = inventory.InventoryType.ToString().ToLower(),
            MinStockLevel = inventory.MinStockLevel,
            MaxStockLevel = inventory.MaxStockLevel,
            Version = inventory.Version,
            CreatedAt = inventory.CreatedAt,
            UpdatedAt = inventory.UpdatedAt
        };
    }

    private StockMovementDto MapMovementToDto(StockMovement movement)
    {
        return new StockMovementDto
        {
            Id = movement.Id,
            InventoryId = movement.InventoryId,
            ProductName = movement.Inventory?.Product?.Name,
            MovementType = movement.MovementType.ToString().ToLower(),
            QuantityChange = movement.QuantityChange,
            QuantityBefore = movement.QuantityBefore,
            QuantityAfter = movement.QuantityAfter,
            ReferenceType = movement.ReferenceType,
            ReferenceId = movement.ReferenceId,
            Notes = movement.Notes,
            IsFifoOverride = movement.IsFifoOverride,
            PerformedByName = movement.PerformedByStaff?.User?.FullName,
            CreatedAt = movement.CreatedAt
        };
    }
}
