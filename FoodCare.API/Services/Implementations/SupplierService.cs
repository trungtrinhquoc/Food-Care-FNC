using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Suppliers;
using FoodCare.API.Services.Interfaces;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Services.Implementations;

public class SupplierService : ISupplierService
{
    private readonly FoodCareDbContext _context;
    private readonly IMapper _mapper;

    public SupplierService(FoodCareDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<SupplierDto>> GetAllSuppliersAsync()
    {
        var suppliers = await _context.Suppliers
            .Where(s => s.IsDeleted == false)
            .Include(s => s.Products)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<SupplierDto>>(suppliers);
    }

    public async Task<SupplierDto?> GetSupplierByIdAsync(int id)
    {
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.Id.Equals(id))
            .Include(s => s.Products)
            .FirstOrDefaultAsync();

        return supplier != null ? _mapper.Map<SupplierDto>(supplier) : null;
    }

    public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto createDto)
    {
        var supplier = _mapper.Map<Supplier>(createDto);
        supplier.CreatedAt = DateTime.UtcNow;
        supplier.IsActive = true;
        supplier.IsDeleted = false;

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync();

        return _mapper.Map<SupplierDto>(supplier);
    }

    public async Task<SupplierDto?> UpdateSupplierAsync(int id, UpdateSupplierDto updateDto)
    {
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.Id.Equals(id))
            .FirstOrDefaultAsync();

        if (supplier == null)
            return null;

        _mapper.Map(updateDto, supplier);
        supplier.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<SupplierDto>(supplier);
    }

    public async Task<bool> DeleteSupplierAsync(int id)
    {
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.Id.Equals(id))
            .FirstOrDefaultAsync();

        if (supplier == null)
            return false;

        supplier.IsDeleted = true;
        supplier.DeletedAt = DateTime.UtcNow;
        supplier.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<(IEnumerable<SupplierDto> Suppliers, int TotalCount)> GetSuppliersWithPaginationAsync(SupplierFilterDto filter)
    {
        var query = _context.Suppliers
            .Where(s => s.IsDeleted == false)
            .Include(s => s.Products)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            query = query.Where(s => 
                s.StoreName.ToLower().Contains(filter.SearchTerm.ToLower()) ||
                (s.ContactEmail != null && s.ContactEmail.ToLower().Contains(filter.SearchTerm.ToLower())) ||
                (s.ContactPhone!= null && s.ContactPhone.Contains(filter.SearchTerm)) ||
                (s.ContactName!= null && s.ContactName.ToLower().Contains(filter.SearchTerm.ToLower()))
            );
        }

        // Apply status filter
        if (filter.IsActive.HasValue)
        {
            query = query.Where(s => s.IsActive.Equals(filter.IsActive.Value));
        }

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "name" => filter.SortDescending ? 
                query.OrderByDescending(s => s.StoreName) : 
                query.OrderBy(s => s.StoreName),
            "createdat" => filter.SortDescending ? 
                query.OrderByDescending(s => s.CreatedAt) : 
                query.OrderBy(s => s.CreatedAt),
            "productcount" => filter.SortDescending ? 
                query.OrderByDescending(s => s.Products.Count) : 
                query.OrderBy(s => s.Products.Count),
            _ => query.OrderByDescending(s => s.CreatedAt)
        };

        var totalCount = await query.CountAsync();

        var suppliers = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return (_mapper.Map<IEnumerable<SupplierDto>>(suppliers), totalCount);
    }
}
