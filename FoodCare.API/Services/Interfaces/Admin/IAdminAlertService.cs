using FoodCare.API.Models.DTOs.Admin;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminAlertService
{
    Task<PagedResult<AdminAlertDto>> GetAlertsAsync(AdminAlertFilterDto filter);
    Task<int> GetUnreadCountAsync();
    Task<bool> MarkAsReadAsync(Guid alertId);
    Task<int> MarkAllAsReadAsync();
}
