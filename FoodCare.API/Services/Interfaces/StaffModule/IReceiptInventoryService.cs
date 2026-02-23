using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Implementations.StaffModule;

namespace FoodCare.API.Services.Interfaces.StaffModule;

public interface IReceiptService
{
    Task<PagedResponse<ReceiptDto>> GetReceiptsAsync(int page, int pageSize, Guid? warehouseId, string? status);
    Task<ReceiptDto?> GetReceiptByIdAsync(Guid receiptId);
    Task<ReceiptDto?> GetReceiptByShipmentIdAsync(Guid shipmentId);
    Task<ReceiptDto> CreateReceiptAsync(CreateReceiptRequest request, Guid staffId);
    Task<ReceiptDto?> StartInspectionAsync(Guid receiptId, Guid staffId);
    Task<ReceiptDto?> InspectItemAsync(Guid receiptId, Guid itemId, InspectReceiptItemRequest request);
    Task<ReceiptDto?> CompleteInspectionAsync(Guid receiptId, CompleteInspectionRequest request, Guid staffId);
    Task<ReceiptDto?> StoreReceiptAsync(Guid receiptId, Guid staffId);
}

public interface IInventoryService
{
    // Inventory queries
    Task<PagedResponse<WarehouseInventoryDto>> GetInventoryAsync(
        int page, int pageSize, Guid? warehouseId, Guid? productId, 
        string? inventoryType, bool? lowStock, bool? nearExpiry);
    Task<WarehouseInventoryDto?> GetInventoryByIdAsync(Guid inventoryId);
    Task<IEnumerable<WarehouseInventoryDto>> GetInventoryByProductAsync(Guid productId);
    Task<int> GetAvailableQuantityAsync(Guid productId, Guid? warehouseId);
    Task<IEnumerable<WarehouseInventoryDto>> GetExpiringInventoryAsync(int days, Guid? warehouseId);
    Task<IEnumerable<WarehouseInventoryDto>> GetLowStockInventoryAsync(Guid? warehouseId);

    // Inventory management
    Task AddToInventoryAsync(AddToInventoryRequest request);
    Task<WarehouseInventoryDto?> AdjustInventoryAsync(Guid inventoryId, AdjustInventoryRequest request, Guid staffId);
    Task TransferInventoryAsync(TransferInventoryRequest request, Guid staffId);
    Task<WarehouseInventoryDto?> QuarantineInventoryAsync(Guid inventoryId, QuarantineInventoryRequest request, Guid staffId);
    Task<WarehouseInventoryDto?> MarkExpiredAsync(Guid inventoryId, MarkExpiredRequest request, Guid staffId);

    // Stock movements
    Task<PagedResponse<StockMovementDto>> GetMovementsAsync(
        int page, int pageSize, Guid? inventoryId, string? movementType, DateTime? from, DateTime? to);
    Task<IEnumerable<StockMovementDto>> GetMovementsByInventoryIdAsync(Guid inventoryId);

    // Reservations
    Task<StockReservationDto> ReserveStockAsync(ReserveStockRequest request);
    Task<bool> ReleaseReservationAsync(Guid reservationId);
    Task ConfirmReservationAsync(Guid reservationId, Guid staffId);
    Task<IEnumerable<StockReservationDto>> GetReservationsByOrderAsync(Guid orderId);

    // FIFO picking
    Task<IEnumerable<FifoPickDto>> GetFifoPickListAsync(PickListRequest request);
    Task ExecuteFifoPickAsync(ExecutePickRequest request, Guid staffId, bool canOverride);
}
