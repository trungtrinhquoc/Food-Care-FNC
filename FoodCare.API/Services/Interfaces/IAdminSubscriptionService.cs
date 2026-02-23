using FoodCare.API.Models.DTOs.Admin.Subscriptions;

namespace FoodCare.API.Services.Interfaces;

public interface IAdminSubscriptionService
{
    /// <summary>
    /// Get all subscriptions with customer details, supports filtering and pagination
    /// </summary>
    Task<PaginatedSubscriptionsResponse> GetAllSubscriptionsAsync(SubscriptionFilters filters);
    
    /// <summary>
    /// Get detailed information for a single subscription
    /// </summary>
    Task<AdminSubscriptionDetailDto?> GetSubscriptionDetailAsync(Guid subscriptionId);
    
    /// <summary>
    /// Manually send reminder emails to specified subscriptions
    /// </summary>
    Task<SendReminderResponse> SendManualRemindersAsync(SendReminderRequest request);
}
