using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.Staff;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;

namespace FoodCare.API.Services.Implementations.StaffModule;

public class WarehouseService : IWarehouseService
{
    private readonly FoodCareDbContext _context;

    public WarehouseService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<WarehouseDto>> GetWarehousesAsync(int page = 1, int pageSize = 20, bool? isActive = null)
    {
        var query = _context.Warehouses.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(w => w.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(w => w.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(w => MapToDto(w))
            .ToListAsync();

        return new PagedResponse<WarehouseDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<WarehouseDto?> GetWarehouseByIdAsync(Guid id)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);
        return warehouse != null ? MapToDto(warehouse) : null;
    }

    public async Task<WarehouseDto?> GetWarehouseByCodeAsync(string code)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == code);
        return warehouse != null ? MapToDto(warehouse) : null;
    }

    public async Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseRequest request)
    {
        var warehouse = new Warehouse
        {
            Id = Guid.NewGuid(),
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            Region = request.Region,
            AddressStreet = request.AddressStreet,
            AddressWard = request.AddressWard,
            AddressDistrict = request.AddressDistrict,
            AddressCity = request.AddressCity,
            Phone = request.Phone,
            Email = request.Email,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Capacity = request.Capacity,
            IsActive = true,
            IsDefault = request.IsDefault,
            CreatedAt = DateTime.UtcNow
        };

        // If this is set as default, unset other defaults
        if (request.IsDefault)
        {
            await _context.Warehouses
                .Where(w => w.IsDefault)
                .ExecuteUpdateAsync(w => w.SetProperty(x => x.IsDefault, false));
        }

        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();

        return MapToDto(warehouse);
    }

    public async Task<WarehouseDto?> UpdateWarehouseAsync(Guid id, UpdateWarehouseRequest request)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);
        if (warehouse == null) return null;

        if (request.Name != null) warehouse.Name = request.Name;
        if (request.Description != null) warehouse.Description = request.Description;
        if (request.Region != null) warehouse.Region = request.Region;
        if (request.AddressStreet != null) warehouse.AddressStreet = request.AddressStreet;
        if (request.AddressWard != null) warehouse.AddressWard = request.AddressWard;
        if (request.AddressDistrict != null) warehouse.AddressDistrict = request.AddressDistrict;
        if (request.AddressCity != null) warehouse.AddressCity = request.AddressCity;
        if (request.Phone != null) warehouse.Phone = request.Phone;
        if (request.Email != null) warehouse.Email = request.Email;
        if (request.Latitude.HasValue) warehouse.Latitude = request.Latitude;
        if (request.Longitude.HasValue) warehouse.Longitude = request.Longitude;
        if (request.Capacity.HasValue) warehouse.Capacity = request.Capacity;
        if (request.IsActive.HasValue) warehouse.IsActive = request.IsActive.Value;
        
        if (request.IsDefault.HasValue && request.IsDefault.Value)
        {
            await _context.Warehouses
                .Where(w => w.IsDefault && w.Id != id)
                .ExecuteUpdateAsync(w => w.SetProperty(x => x.IsDefault, false));
            warehouse.IsDefault = true;
        }

        warehouse.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(warehouse);
    }

    public async Task<bool> DeleteWarehouseAsync(Guid id)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);
        if (warehouse == null) return false;

        // Soft delete by deactivating
        warehouse.IsActive = false;
        warehouse.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<WarehouseDto?> GetDefaultWarehouseAsync()
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.IsDefault && w.IsActive);
        return warehouse != null ? MapToDto(warehouse) : null;
    }

    private static WarehouseDto MapToDto(Warehouse warehouse)
    {
        return new WarehouseDto
        {
            Id = warehouse.Id,
            Code = warehouse.Code,
            Name = warehouse.Name,
            Description = warehouse.Description,
            Region = warehouse.Region,
            AddressStreet = warehouse.AddressStreet,
            AddressWard = warehouse.AddressWard,
            AddressDistrict = warehouse.AddressDistrict,
            AddressCity = warehouse.AddressCity,
            Phone = warehouse.Phone,
            Email = warehouse.Email,
            Latitude = warehouse.Latitude,
            Longitude = warehouse.Longitude,
            Capacity = warehouse.Capacity,
            IsActive = warehouse.IsActive,
            IsDefault = warehouse.IsDefault,
            CreatedAt = warehouse.CreatedAt
        };
    }

    /// <summary>
    /// Get the nearest active warehouse for a given region (North/Central/South).
    /// Used for auto-assigning supplier shipments.
    /// </summary>
    public async Task<Warehouse?> GetWarehouseByRegionAsync(string region)
    {
        return await _context.Warehouses
            .Where(w => w.IsActive && w.Region != null && w.Region.ToLower() == region.ToLower())
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Determine region from a Vietnamese city name.
    /// </summary>
    public static string? DetermineRegionFromCity(string? city)
    {
        if (string.IsNullOrEmpty(city)) return null;

        var cityLower = city.ToLower().Trim();

        // Southern cities
        var southCities = new[] {
            "hồ chí minh", "ho chi minh", "hcm", "bình dương", "binh duong",
            "đồng nai", "dong nai", "long an", "bà rịa", "ba ria", "vũng tàu", "vung tau",
            "tây ninh", "tay ninh", "bình phước", "binh phuoc", "tiền giang", "tien giang",
            "bến tre", "ben tre", "cần thơ", "can tho", "an giang", "kiên giang", "kien giang",
            "cà mau", "ca mau", "sóc trăng", "soc trang", "bạc liêu", "bac lieu",
            "trà vinh", "tra vinh", "vĩnh long", "vinh long", "đồng tháp", "dong thap",
            "hậu giang", "hau giang"
        };

        // Central cities
        var centralCities = new[] {
            "đà nẵng", "da nang", "huế", "hue", "quảng nam", "quang nam",
            "quảng ngãi", "quang ngai", "bình định", "binh dinh", "phú yên", "phu yen",
            "khánh hòa", "khanh hoa", "nha trang", "ninh thuận", "ninh thuan",
            "bình thuận", "binh thuan", "gia lai", "kon tum", "đắk lắk", "dak lak",
            "đắk nông", "dak nong", "lâm đồng", "lam dong", "đà lạt", "da lat",
            "quảng bình", "quang binh", "quảng trị", "quang tri", "hà tĩnh", "ha tinh",
            "nghệ an", "nghe an", "thanh hóa", "thanh hoa"
        };

        if (southCities.Any(c => cityLower.Contains(c))) return "South";
        if (centralCities.Any(c => cityLower.Contains(c))) return "Central";
        return "North"; // Default to North for remaining cities
    }

    /// <summary>
    /// Get all warehouse IDs assigned to a staff member via StaffWarehouse join table.
    /// Falls back to the legacy single WarehouseId if no join table entries exist.
    /// </summary>
    public async Task<List<Guid>> GetStaffWarehouseIdsAsync(Guid staffId)
    {
        // Single warehouse per staff — read directly from StaffMember.WarehouseId
        var staff = await _context.StaffMembers.FindAsync(staffId);
        if (staff?.WarehouseId != null)
            return new List<Guid> { staff.WarehouseId.Value };

        return new List<Guid>();
    }

    /// <summary>
    /// Check if a staff member has access to a specific warehouse.
    /// </summary>
    public async Task<bool> StaffHasWarehouseAccessAsync(Guid staffId, Guid warehouseId)
    {
        var warehouseIds = await GetStaffWarehouseIdsAsync(staffId);
        return warehouseIds.Contains(warehouseId);
    }
}
