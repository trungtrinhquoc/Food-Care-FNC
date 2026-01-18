using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Subscriptions;

namespace FoodCare.API.Services.Interfaces
{
    public interface ISubscriptionService
    {
        // Lấy danh sách option (weekly, monthly, discount...)
        Task<List<SubscriptionOptionDto>> GetSubscriptionOptionsAsync();

        Task<SubscriptionDto> CreateSubscriptionAsync(CreateSubscriptionDto dto, Guid userId);

        Task<bool> PauseSubscriptionAsync(Guid subscriptionId, DateOnly? pauseUntil);

        Task<bool> ResumeSubscriptionAsync(Guid subscriptionId);

        Task<List<SubscriptionDto>> GetUserSubscriptionsAsync(Guid userId);
    }
}
