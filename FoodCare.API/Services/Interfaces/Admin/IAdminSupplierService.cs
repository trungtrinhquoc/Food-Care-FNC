using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Suppliers;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminSupplierService
{
    Task<PagedResult<AdminSupplierDto>> GetSuppliersAsync(AdminSupplierFilterDto filter);
    Task<AdminSupplierDetailDto?> GetSupplierDetailAsync(int id);
}
