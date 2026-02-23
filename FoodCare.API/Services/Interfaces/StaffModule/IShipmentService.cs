using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FoodCare.API.Models.DTOs.Staff;

namespace FoodCare.API.Services.Interfaces.StaffModule;

public interface IShipmentService
{
    // Shipment CRUD
    Task<PagedResponse<SupplierShipmentDto>> GetShipmentsAsync(ShipmentQueryParams queryParams);
    Task<SupplierShipmentDto?> GetShipmentByIdAsync(Guid id);
    Task<SupplierShipmentDto?> GetShipmentByReferenceAsync(string externalReference);
    Task<SupplierShipmentDto> CreateShipmentAsync(int supplierId, Guid userId, CreateShipmentRequest request);
    Task<SupplierShipmentDto?> UpdateShipmentStatusAsync(Guid id, Guid userId, UpdateShipmentStatusRequest request);
    Task<bool> CancelShipmentAsync(Guid id, Guid userId, string? reason = null);
    
    // Shipment items
    Task<List<ShipmentItemDto>> GetShipmentItemsAsync(Guid shipmentId);
    
    // Shipment documents
    Task<ShipmentDocumentDto> AddDocumentAsync(Guid shipmentId, Guid userId, string documentType, string fileName, string fileUrl, string? mimeType = null, long? fileSize = null);
    Task<List<ShipmentDocumentDto>> GetDocumentsAsync(Guid shipmentId);
    Task<bool> DeleteDocumentAsync(Guid documentId);
    
    // Status history
    Task<List<ShipmentStatusHistoryDto>> GetStatusHistoryAsync(Guid shipmentId);
    
    // Supplier-specific
    Task<PagedResponse<SupplierShipmentDto>> GetSupplierShipmentsAsync(int supplierId, ShipmentQueryParams queryParams);

    // Methods for Supplier controller
    Task<PagedResponse<SupplierShipmentDto>> GetShipmentsBySupplierAsync(Guid supplierId, int page, int pageSize, string? status);
    Task<SupplierShipmentDto> CreateShipmentAsync(CreateSupplierShipmentRequest request, Guid supplierId);
    Task<SupplierShipmentDto?> UpdateShipmentAsync(Guid id, UpdateSupplierShipmentRequest request);
    Task<SupplierShipmentDto?> AddShipmentItemAsync(Guid shipmentId, AddShipmentItemRequest request);
    Task<SupplierShipmentDto?> UpdateShipmentItemAsync(Guid shipmentId, Guid itemId, UpdateShipmentItemRequest request);
    Task<bool> RemoveShipmentItemAsync(Guid shipmentId, Guid itemId);
    Task<ShipmentDocumentDto> AddDocumentAsync(Guid shipmentId, AddShipmentDocumentRequest request);
    Task<SupplierShipmentDto?> DispatchShipmentAsync(Guid id, DispatchShipmentRequest request);
    Task<SupplierShipmentDto?> MarkInTransitAsync(Guid id, UpdateTransitRequest request);
    Task<bool> CancelShipmentAsync(Guid id, CancelShipmentRequest request);
    Task<object> GetSupplierShipmentStatsAsync(Guid supplierId);
}
