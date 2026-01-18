using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Orders;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminOrderService
{
    Task<PagedResult<AdminOrderDto>> GetOrdersAsync(AdminOrderFilterDto filter);
    Task<AdminOrderDetailDto?> GetOrderDetailAsync(Guid id);
    Task<List<AdminOrderDto>> GetRecentOrdersAsync(int count = 10);
    Task<bool> UpdateOrderStatusAsync(Guid id, UpdateOrderStatusDto dto);
}
