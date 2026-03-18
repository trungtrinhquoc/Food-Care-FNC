using FoodCare.API.Models.DTOs.Shipping;

namespace FoodCare.API.Services.Interfaces;

public interface IShippingFlowService
{
    #region User Operations

    /// <summary>
    /// User gets tracking info for their order
    /// </summary>
    Task<UserOrderTrackingDto?> GetUserOrderTrackingAsync(Guid userId, Guid orderId);

    /// <summary>
    /// User gets all their orders with tracking
    /// </summary>
    Task<List<UserOrderTrackingDto>> GetUserOrdersTrackingAsync(Guid userId, string? status = null, int page = 1, int pageSize = 20);

    /// <summary>
    /// User confirms delivery received
    /// </summary>
    Task<UserOrderTrackingDto> UserConfirmDeliveryAsync(UserConfirmDeliveryDto dto, Guid userId);

    /// <summary>
    /// User requests return
    /// </summary>
    Task<UserOrderTrackingDto> UserRequestReturnAsync(UserRequestReturnDto dto, Guid userId);

    /// <summary>
    /// User cancels order (if allowed)
    /// </summary>
    Task<UserOrderTrackingDto> UserCancelOrderAsync(Guid orderId, Guid userId, string reason);

    #endregion
}
