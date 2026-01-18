using FoodCare.API.Models.DTOs.Admin.Stats;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminStatsService
{
    Task<AdminStatsDto> GetDashboardStatsAsync();
    Task<List<RevenueDataDto>> GetRevenueDataAsync(int months = 6);
    Task<DashboardSummaryDto> GetDashboardSummaryAsync();
}
