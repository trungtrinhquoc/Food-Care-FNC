using System;
using System.Threading.Tasks;
using FoodCare.API.Models.DTOs.Staff;

namespace FoodCare.API.Services.Interfaces.StaffModule;

/// <summary>
/// Service interface for Inbound Session management (Phiên nhập kho)
/// </summary>
public interface IInboundSessionService
{
    // Session CRUD
    Task<PagedResponse<InboundSessionDto>> GetSessionsAsync(
        int page, int pageSize, Guid? warehouseId, string? status);
    Task<InboundSessionDto?> GetSessionByIdAsync(Guid sessionId);
    Task<InboundSessionDto> CreateSessionAsync(CreateInboundSessionRequest request, Guid staffId);

    // Add items (auto-groups by supplier)
    Task<InboundSessionDto> AddItemAsync(Guid sessionId, AddInboundItemRequest request, Guid staffId);
    Task<InboundSessionDto> AddItemsBatchAsync(Guid sessionId, AddInboundItemsBatchRequest request, Guid staffId);

    // Update/remove detail
    Task<InboundSessionDto> UpdateDetailAsync(Guid sessionId, Guid detailId, UpdateInboundDetailRequest request);
    Task<InboundSessionDto> RemoveDetailAsync(Guid sessionId, Guid detailId);

    // Session workflow
    Task<InboundSessionDto> StartProcessingAsync(Guid sessionId, Guid staffId);
    Task<InboundSessionDto> CompleteSessionAsync(Guid sessionId, CompleteInboundSessionRequest request, Guid staffId);
    Task<InboundSessionDto> CancelSessionAsync(Guid sessionId, Guid staffId);

    // Area-matched product lookup
    /// <summary>
    /// Get approved products from suppliers in the same Ward/City as the warehouse.
    /// Falls back to nearest suppliers within 10km radius using Haversine distance.
    /// </summary>
    Task<List<AreaMatchedProductDto>> GetAreaMatchedProductsAsync(Guid warehouseId);

    /// <summary>
    /// Get shipments linked to an inbound session
    /// </summary>
    Task<List<SupplierShipmentDto>> GetSessionShipmentsAsync(Guid sessionId);
}
