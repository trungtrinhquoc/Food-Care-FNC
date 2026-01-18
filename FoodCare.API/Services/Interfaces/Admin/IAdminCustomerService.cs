using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Customers;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminCustomerService
{
    Task<PagedResult<AdminCustomerDto>> GetCustomersAsync(AdminCustomerFilterDto filter);
    Task<AdminCustomerDetailDto?> GetCustomerDetailAsync(Guid id);
}
