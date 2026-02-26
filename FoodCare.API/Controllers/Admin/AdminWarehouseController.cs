using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.Staff;
using FoodCare.API.Models.DTOs.Staff;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/warehouses")]
[Authorize(Roles = "admin")]
public class AdminWarehouseController : ControllerBase
{
    private readonly FoodCareDbContext _context;

    public AdminWarehouseController(FoodCareDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all warehouses with staff count
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetWarehouses(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null,
        [FromQuery] string? region = null)
    {
        var query = _context.Warehouses.AsQueryable();

        if (isActive.HasValue)
            query = query.Where(w => w.IsActive == isActive.Value);

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(w =>
                w.Name.ToLower().Contains(s) ||
                w.Code.ToLower().Contains(s) ||
                (w.AddressCity != null && w.AddressCity.ToLower().Contains(s)));
        }

        if (!string.IsNullOrEmpty(region))
            query = query.Where(w => w.Region != null && w.Region.ToLower() == region.ToLower());

        var totalCount = await query.CountAsync();

        var warehouses = await query
            .OrderBy(w => w.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new AdminWarehouseDto
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                Description = w.Description,
                Region = w.Region,
                AddressStreet = w.AddressStreet,
                AddressWard = w.AddressWard,
                AddressDistrict = w.AddressDistrict,
                AddressCity = w.AddressCity,
                Phone = w.Phone,
                Email = w.Email,
                Latitude = w.Latitude,
                Longitude = w.Longitude,
                Capacity = w.Capacity,
                IsActive = w.IsActive,
                IsDefault = w.IsDefault,
                CreatedAt = w.CreatedAt,
                StaffCount = w.StaffMembers.Count(s => s.IsActive),
                TotalInventoryItems = w.Inventories.Count()
            })
            .ToListAsync();

        return Ok(new
        {
            items = warehouses,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    /// <summary>
    /// Get warehouse by ID with staff list
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWarehouse(Guid id)
    {
        var warehouse = await _context.Warehouses
            .Include(w => w.StaffMembers.Where(s => s.IsActive))
                .ThenInclude(s => s.User)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (warehouse == null)
            return NotFound(new { message = "Không tìm thấy kho hàng" });

        var dto = new AdminWarehouseDetailDto
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
            CreatedAt = warehouse.CreatedAt,
            StaffCount = warehouse.StaffMembers.Count,
            TotalInventoryItems = await _context.WarehouseInventories.CountAsync(i => i.WarehouseId == id),
            StaffMembers = warehouse.StaffMembers.Select(s => new WarehouseStaffDto
            {
                StaffMemberId = s.Id,
                UserId = s.UserId,
                EmployeeCode = s.EmployeeCode,
                FullName = s.User?.FullName,
                Email = s.User?.Email,
                Phone = s.User?.PhoneNumber,
                Department = s.Department,
                Position = s.Position,
                CanApproveReceipts = s.CanApproveReceipts,
                CanAdjustInventory = s.CanAdjustInventory,
                HireDate = s.HireDate,
                IsActive = s.IsActive
            }).ToList()
        };

        return Ok(dto);
    }

    /// <summary>
    /// Get simple warehouse list for dropdowns
    /// </summary>
    [HttpGet("dropdown")]
    public async Task<IActionResult> GetWarehousesDropdown()
    {
        var warehouses = await _context.Warehouses
            .Where(w => w.IsActive)
            .OrderBy(w => w.Name)
            .Select(w => new
            {
                id = w.Id,
                code = w.Code,
                name = w.Name,
                region = w.Region
            })
            .ToListAsync();

        return Ok(warehouses);
    }

    /// <summary>
    /// Create a new warehouse
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseRequest request)
    {
        // Check code uniqueness
        var exists = await _context.Warehouses.AnyAsync(w => w.Code == request.Code);
        if (exists)
            return BadRequest(new { message = $"Mã kho '{request.Code}' đã tồn tại" });

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

        if (request.IsDefault)
        {
            await _context.Warehouses
                .Where(w => w.IsDefault)
                .ExecuteUpdateAsync(w => w.SetProperty(x => x.IsDefault, false));
        }

        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, new { id = warehouse.Id, message = "Tạo kho hàng thành công" });
    }

    /// <summary>
    /// Update warehouse
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateWarehouse(Guid id, [FromBody] UpdateWarehouseRequest request)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);
        if (warehouse == null)
            return NotFound(new { message = "Không tìm thấy kho hàng" });

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

        return Ok(new { message = "Cập nhật kho hàng thành công" });
    }

    /// <summary>
    /// Toggle warehouse active status
    /// </summary>
    [HttpPatch("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);
        if (warehouse == null)
            return NotFound(new { message = "Không tìm thấy kho hàng" });

        warehouse.IsActive = !warehouse.IsActive;
        warehouse.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { isActive = warehouse.IsActive, message = warehouse.IsActive ? "Kho hàng đã được kích hoạt" : "Kho hàng đã bị vô hiệu hóa" });
    }

    /// <summary>
    /// Delete warehouse (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteWarehouse(Guid id)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);
        if (warehouse == null)
            return NotFound(new { message = "Không tìm thấy kho hàng" });

        // Check if warehouse has active staff
        var activeStaffCount = await _context.StaffMembers.CountAsync(s => s.WarehouseId == id && s.IsActive);
        if (activeStaffCount > 0)
            return BadRequest(new { message = $"Không thể xóa kho hàng đang có {activeStaffCount} nhân viên hoạt động" });

        warehouse.IsActive = false;
        warehouse.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Xóa kho hàng thành công" });
    }

    /// <summary>
    /// Get warehouse statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetWarehouseStats()
    {
        var total = await _context.Warehouses.CountAsync();
        var active = await _context.Warehouses.CountAsync(w => w.IsActive);
        var totalStaff = await _context.StaffMembers.CountAsync(s => s.IsActive);
        var byRegion = await _context.Warehouses
            .Where(w => w.IsActive && w.Region != null)
            .GroupBy(w => w.Region!)
            .Select(g => new { Region = g.Key, Count = g.Count() })
            .ToListAsync();

        return Ok(new
        {
            totalWarehouses = total,
            activeWarehouses = active,
            inactiveWarehouses = total - active,
            totalStaffAssigned = totalStaff,
            warehousesByRegion = byRegion.ToDictionary(x => x.Region, x => x.Count)
        });
    }
}

// DTO classes for Admin Warehouse
public class AdminWarehouseDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Region { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int? Capacity { get; set; }
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public int StaffCount { get; set; }
    public int TotalInventoryItems { get; set; }
}

public class AdminWarehouseDetailDto : AdminWarehouseDto
{
    public List<WarehouseStaffDto> StaffMembers { get; set; } = new();
}

public class WarehouseStaffDto
{
    public Guid StaffMemberId { get; set; }
    public Guid UserId { get; set; }
    public string EmployeeCode { get; set; } = null!;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Department { get; set; }
    public string? Position { get; set; }
    public bool CanApproveReceipts { get; set; }
    public bool CanAdjustInventory { get; set; }
    public DateTime? HireDate { get; set; }
    public bool IsActive { get; set; }
}
