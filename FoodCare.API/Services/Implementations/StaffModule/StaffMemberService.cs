using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.Staff;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;

namespace FoodCare.API.Services.Implementations.StaffModule;

public class StaffMemberService : IStaffMemberService
{
    private readonly FoodCareDbContext _context;

    public StaffMemberService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<StaffMemberDto>> GetStaffMembersAsync(int page = 1, int pageSize = 20, Guid? warehouseId = null, bool? isActive = null)
    {
        var query = _context.StaffMembers
            .Include(s => s.User)
            .Include(s => s.Warehouse)
            .AsQueryable();

        if (warehouseId.HasValue)
        {
            query = query.Where(s => s.WarehouseId == warehouseId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(s => s.EmployeeCode)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => MapToDto(s))
            .ToListAsync();

        return new PagedResponse<StaffMemberDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StaffMemberDto?> GetStaffMemberByIdAsync(Guid id)
    {
        var staff = await _context.StaffMembers
            .Include(s => s.User)
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.Id == id);

        return staff != null ? MapToDto(staff) : null;
    }

    public async Task<StaffMemberDto?> GetStaffMemberByUserIdAsync(Guid userId)
    {
        var staff = await _context.StaffMembers
            .Include(s => s.User)
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.UserId == userId);

        return staff != null ? MapToDto(staff) : null;
    }

    public async Task<StaffMemberDto?> GetStaffMemberByEmployeeCodeAsync(string employeeCode)
    {
        var staff = await _context.StaffMembers
            .Include(s => s.User)
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.EmployeeCode == employeeCode);

        return staff != null ? MapToDto(staff) : null;
    }

    public async Task<StaffMemberDto> CreateStaffMemberAsync(CreateStaffMemberRequest request)
    {
        // Verify user exists and has staff role
        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null)
        {
            throw new ArgumentException("User not found");
        }

        // Check if staff member already exists for this user
        var existingStaff = await _context.StaffMembers.AnyAsync(s => s.UserId == request.UserId);
        if (existingStaff)
        {
            throw new ArgumentException("Staff member already exists for this user");
        }

        // Check employee code uniqueness
        var codeExists = await _context.StaffMembers.AnyAsync(s => s.EmployeeCode == request.EmployeeCode);
        if (codeExists)
        {
            throw new ArgumentException("Employee code already exists");
        }

        var staff = new StaffMember
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            EmployeeCode = request.EmployeeCode,
            Department = request.Department,
            Position = request.Position,
            WarehouseId = request.WarehouseId,
            CanApproveReceipts = request.CanApproveReceipts,
            CanAdjustInventory = request.CanAdjustInventory,
            CanOverrideFifo = request.CanOverrideFifo,
            HireDate = request.HireDate,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.StaffMembers.Add(staff);
        await _context.SaveChangesAsync();

        // Reload with navigation properties
        await _context.Entry(staff).Reference(s => s.User).LoadAsync();
        if (staff.WarehouseId.HasValue)
        {
            await _context.Entry(staff).Reference(s => s.Warehouse).LoadAsync();
        }

        return MapToDto(staff);
    }

    public async Task<StaffMemberDto?> UpdateStaffMemberAsync(Guid id, UpdateStaffMemberRequest request)
    {
        var staff = await _context.StaffMembers
            .Include(s => s.User)
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (staff == null) return null;

        if (request.Department != null) staff.Department = request.Department;
        if (request.Position != null) staff.Position = request.Position;
        if (request.WarehouseId.HasValue) staff.WarehouseId = request.WarehouseId;
        if (request.CanApproveReceipts.HasValue) staff.CanApproveReceipts = request.CanApproveReceipts.Value;
        if (request.CanAdjustInventory.HasValue) staff.CanAdjustInventory = request.CanAdjustInventory.Value;
        if (request.CanOverrideFifo.HasValue) staff.CanOverrideFifo = request.CanOverrideFifo.Value;
        if (request.IsActive.HasValue) staff.IsActive = request.IsActive.Value;

        staff.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Reload warehouse if changed
        if (request.WarehouseId.HasValue)
        {
            await _context.Entry(staff).Reference(s => s.Warehouse).LoadAsync();
        }

        return MapToDto(staff);
    }

    public async Task<bool> DeleteStaffMemberAsync(Guid id)
    {
        var staff = await _context.StaffMembers.FindAsync(id);
        if (staff == null) return false;

        // Soft delete by deactivating
        staff.IsActive = false;
        staff.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> AssignToWarehouseAsync(Guid staffId, Guid warehouseId)
    {
        var staff = await _context.StaffMembers.FindAsync(staffId);
        if (staff == null) return false;

        var warehouse = await _context.Warehouses.FindAsync(warehouseId);
        if (warehouse == null || !warehouse.IsActive) return false;

        staff.WarehouseId = warehouseId;
        staff.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    private static StaffMemberDto MapToDto(StaffMember staff)
    {
        return new StaffMemberDto
        {
            Id = staff.Id,
            UserId = staff.UserId,
            EmployeeCode = staff.EmployeeCode,
            Department = staff.Department,
            Position = staff.Position,
            WarehouseId = staff.WarehouseId,
            WarehouseName = staff.Warehouse?.Name,
            CanApproveReceipts = staff.CanApproveReceipts,
            CanAdjustInventory = staff.CanAdjustInventory,
            CanOverrideFifo = staff.CanOverrideFifo,
            HireDate = staff.HireDate,
            IsActive = staff.IsActive,
            CreatedAt = staff.CreatedAt,
            UserFullName = staff.User?.FullName,
            UserEmail = staff.User?.Email,
            UserPhone = staff.User?.PhoneNumber,
            UserAvatarUrl = staff.User?.AvatarUrl
        };
    }

    public async Task<bool> HasPermissionAsync(Guid staffId, string permission)
    {
        var staff = await _context.StaffMembers.FindAsync(staffId);
        if (staff == null || !staff.IsActive)
            return false;

        return permission.ToLower() switch
        {
            "approve_receipts" or "can_approve_receipts" => staff.CanApproveReceipts,
            "adjust_inventory" or "can_adjust_inventory" => staff.CanAdjustInventory,
            "override_fifo" or "can_override_fifo" => staff.CanOverrideFifo,
            _ => false
        };
    }

    /// <summary>
    /// Get all warehouse IDs assigned to a user (via staff member).
    /// Single warehouse per staff — uses StaffMember.WarehouseId directly.
    /// </summary>
    public async Task<List<Guid>> GetWarehouseIdsAsync(Guid userId)
    {
        var staff = await _context.StaffMembers
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive);

        if (staff?.WarehouseId != null)
            return new List<Guid> { staff.WarehouseId.Value };

        return new List<Guid>();
    }
}
