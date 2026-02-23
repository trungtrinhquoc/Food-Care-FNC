using FoodCare.API.Models.DTOs.Subscriptions;

namespace FoodCare.API.Services.Interfaces;

public interface ISubscriptionReminderService
{
    /// <summary>
    /// Gửi email nhắc nhở cho tất cả subscriptions sắp đến hạn giao (3 ngày tới)
    /// </summary>
    Task<int> SendPendingRemindersAsync();

    /// <summary>
    /// Lấy thông tin subscription từ confirmation token
    /// </summary>
    Task<SubscriptionConfirmationDto?> GetConfirmationDetailsAsync(string token);

    /// <summary>
    /// Xử lý response từ khách hàng (continue/pause/cancel)
    /// </summary>
    Task<bool> ProcessConfirmationAsync(ProcessConfirmationRequest request);

    /// <summary>
    /// Lấy thống kê cho admin dashboard
    /// </summary>
    Task<SubscriptionReminderStatsDto> GetStatisticsAsync();
}
