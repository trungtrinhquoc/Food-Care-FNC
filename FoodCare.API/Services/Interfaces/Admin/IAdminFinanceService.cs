using FoodCare.API.Models.DTOs.Admin;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminFinanceService
{
    Task<FinanceSummaryDto> GetSummaryAsync(int month, int year);
    Task<List<MartSettlementDto>> GetSettlementsAsync(int month, int year);
    Task SettleAllAsync(int month, int year);
}
