using FoodCare.API.Models.DTOs.Suppliers;

namespace FoodCare.API.Services.Interfaces;

public interface ISupplierService
{
    Task<IEnumerable<SupplierDto>> GetAllSuppliersAsync();
    Task<SupplierDto?> GetSupplierByIdAsync(int id);
    Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto createDto);
    Task<SupplierDto?> UpdateSupplierAsync(int id, UpdateSupplierDto updateDto);
    Task<bool> DeleteSupplierAsync(int id);
    Task<(IEnumerable<SupplierDto> Suppliers, int TotalCount)> GetSuppliersWithPaginationAsync(SupplierFilterDto filter);
}
