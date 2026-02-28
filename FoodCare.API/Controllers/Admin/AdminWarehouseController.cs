using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.Staff;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/warehouses")]
[Authorize(Roles = "admin")]
public class AdminWarehouseController : ControllerBase
{
    private readonly FoodCareDbContext _context;

    // Positions that can access the staff system (frontend login)
    private static readonly StaffPosition[] SystemAccessPositions = {
        StaffPosition.WarehouseManager,
        StaffPosition.AssistantManager,
        StaffPosition.Supervisor
    };

    public AdminWarehouseController(FoodCareDbContext context)
    {
        _context = context;
    }

    private static string GetPositionLabel(StaffPosition? pos)
    {
        return pos switch
        {
            StaffPosition.WarehouseManager => "Trưởng phòng kho",
            StaffPosition.AssistantManager => "Phó quản lý kho",
            StaffPosition.Supervisor => "Tổ trưởng / Giám sát kho",
            StaffPosition.InventoryController => "Nhân viên kiểm soát tồn kho",
            StaffPosition.WarehouseStaff => "Nhân viên kho",
            StaffPosition.Loader => "Nhân viên bốc xếp",
            _ => "Chưa xác định"
        };
    }

    private static bool CanAccessSystem(StaffPosition? pos)
    {
        return pos.HasValue && SystemAccessPositions.Contains(pos.Value);
    }

    /// <summary>
    /// Get available staff positions with descriptions
    /// </summary>
    [HttpGet("staff/positions")]
    public IActionResult GetStaffPositions()
    {
        var positions = Enum.GetValues<StaffPosition>().Select(p => new
        {
            value = p.ToString(),
            numericValue = (int)p,
            label = GetPositionLabel(p),
            canAccessSystem = SystemAccessPositions.Contains(p),
            description = p switch
            {
                StaffPosition.WarehouseManager => "Quản lý toàn bộ hoạt động kho, lập kế hoạch nhập/xuất/tồn, quản lý nhân sự kho, kiểm soát KPI",
                StaffPosition.AssistantManager => "Hỗ trợ Warehouse Manager, giám sát từng khu vực, điều phối ca làm việc",
                StaffPosition.Supervisor => "Quản lý trực tiếp nhân viên kho, phân công công việc, giám sát quy trình, báo cáo cấp trên",
                StaffPosition.InventoryController => "Theo dõi số lượng tồn, kiểm kê định kỳ, đối chiếu dữ liệu hệ thống với thực tế",
                StaffPosition.WarehouseStaff => "Nhập hàng, xuất hàng, sắp xếp hàng hóa, đóng gói, dán nhãn",
                StaffPosition.Loader => "Vận hành xe nâng, bốc dỡ hàng hóa, hỗ trợ nhập/xuất",
                _ => ""
            }
        });

        return Ok(positions);
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
                StaffPositionEnum = s.StaffPositionEnum,
                StaffPositionLabel = GetPositionLabel(s.StaffPositionEnum),
                CanAccessSystem = CanAccessSystem(s.StaffPositionEnum),
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

    // =====================================================
    // WAREHOUSE STAFF MANAGEMENT ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get all staff members assigned to a specific warehouse
    /// </summary>
    [HttpGet("{warehouseId:guid}/staff")]
    public async Task<IActionResult> GetWarehouseStaff(
        Guid warehouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var warehouse = await _context.Warehouses.FindAsync(warehouseId);
        if (warehouse == null)
            return NotFound(new { message = "Không tìm thấy kho hàng" });

        var query = _context.StaffMembers
            .Include(s => s.User)
            .Where(s => s.WarehouseId == warehouseId);

        if (isActive.HasValue)
            query = query.Where(s => s.IsActive == isActive.Value);

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(sm =>
                (sm.User.FullName != null && sm.User.FullName.ToLower().Contains(s)) ||
                sm.User.Email.ToLower().Contains(s) ||
                sm.EmployeeCode.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        var staffList = await query
            .OrderBy(s => s.EmployeeCode)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new WarehouseStaffDetailDto
            {
                StaffMemberId = s.Id,
                UserId = s.UserId,
                EmployeeCode = s.EmployeeCode,
                FullName = s.User.FullName,
                Email = s.User.Email,
                Phone = s.User.PhoneNumber,
                AvatarUrl = s.User.AvatarUrl,
                Department = s.Department,
                Position = s.Position,
                StaffPositionEnum = s.StaffPositionEnum,
                CanApproveReceipts = s.CanApproveReceipts,
                CanAdjustInventory = s.CanAdjustInventory,
                CanOverrideFifo = s.CanOverrideFifo,
                HireDate = s.HireDate,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        // Compute labels after materialization
        foreach (var s in staffList)
        {
            s.StaffPositionLabel = GetPositionLabel(s.StaffPositionEnum);
            s.CanAccessSystem = CanAccessSystem(s.StaffPositionEnum);
        }

        return Ok(new
        {
            items = staffList,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            warehouseName = warehouse.Name
        });
    }

    /// <summary>
    /// Get staff members not assigned to any warehouse (available for assignment)
    /// </summary>
    [HttpGet("staff/unassigned")]
    public async Task<IActionResult> GetUnassignedStaff([FromQuery] string? search = null)
    {
        var query = _context.StaffMembers
            .Include(s => s.User)
            .Where(s => s.WarehouseId == null && s.IsActive);

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(sm =>
                (sm.User.FullName != null && sm.User.FullName.ToLower().Contains(s)) ||
                sm.User.Email.ToLower().Contains(s) ||
                sm.EmployeeCode.ToLower().Contains(s));
        }

        var staffList = await query
            .OrderBy(s => s.EmployeeCode)
            .Take(50)
            .Select(s => new WarehouseStaffDetailDto
            {
                StaffMemberId = s.Id,
                UserId = s.UserId,
                EmployeeCode = s.EmployeeCode,
                FullName = s.User.FullName,
                Email = s.User.Email,
                Phone = s.User.PhoneNumber,
                AvatarUrl = s.User.AvatarUrl,
                Department = s.Department,
                Position = s.Position,
                StaffPositionEnum = s.StaffPositionEnum,
                CanApproveReceipts = s.CanApproveReceipts,
                CanAdjustInventory = s.CanAdjustInventory,
                CanOverrideFifo = s.CanOverrideFifo,
                HireDate = s.HireDate,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        foreach (var s in staffList)
        {
            s.StaffPositionLabel = GetPositionLabel(s.StaffPositionEnum);
            s.CanAccessSystem = CanAccessSystem(s.StaffPositionEnum);
        }

        return Ok(staffList);
    }

    /// <summary>
    /// Get all staff members with their warehouse info (for transfer UI)
    /// </summary>
    [HttpGet("staff/all")]
    public async Task<IActionResult> GetAllStaffWithWarehouse(
        [FromQuery] string? search = null,
        [FromQuery] Guid? excludeWarehouseId = null)
    {
        var query = _context.StaffMembers
            .Include(s => s.User)
            .Include(s => s.Warehouse)
            .Where(s => s.IsActive);

        if (excludeWarehouseId.HasValue)
            query = query.Where(s => s.WarehouseId != excludeWarehouseId.Value || s.WarehouseId == null);

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(sm =>
                (sm.User.FullName != null && sm.User.FullName.ToLower().Contains(s)) ||
                sm.User.Email.ToLower().Contains(s) ||
                sm.EmployeeCode.ToLower().Contains(s));
        }

        var staffList = await query
            .OrderBy(s => s.EmployeeCode)
            .Take(50)
            .Select(s => new WarehouseStaffDetailDto
            {
                StaffMemberId = s.Id,
                UserId = s.UserId,
                EmployeeCode = s.EmployeeCode,
                FullName = s.User.FullName,
                Email = s.User.Email,
                Phone = s.User.PhoneNumber,
                AvatarUrl = s.User.AvatarUrl,
                Department = s.Department,
                Position = s.Position,
                StaffPositionEnum = s.StaffPositionEnum,
                CanApproveReceipts = s.CanApproveReceipts,
                CanAdjustInventory = s.CanAdjustInventory,
                CanOverrideFifo = s.CanOverrideFifo,
                HireDate = s.HireDate,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt,
                CurrentWarehouseId = s.WarehouseId,
                CurrentWarehouseName = s.Warehouse != null ? s.Warehouse.Name : null
            })
            .ToListAsync();

        foreach (var s in staffList)
        {
            s.StaffPositionLabel = GetPositionLabel(s.StaffPositionEnum);
            s.CanAccessSystem = CanAccessSystem(s.StaffPositionEnum);
        }

        return Ok(staffList);
    }

    /// <summary>
    /// Assign an existing staff member to a warehouse
    /// </summary>
    [HttpPost("{warehouseId:guid}/staff/assign")]
    public async Task<IActionResult> AssignStaffToWarehouse(Guid warehouseId, [FromBody] AssignStaffRequest request)
    {
        var warehouse = await _context.Warehouses.FindAsync(warehouseId);
        if (warehouse == null)
            return NotFound(new { message = "Không tìm thấy kho hàng" });

        if (!warehouse.IsActive)
            return BadRequest(new { message = "Kho hàng đã bị vô hiệu hóa" });

        var staff = await _context.StaffMembers
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == request.StaffMemberId);

        if (staff == null)
            return NotFound(new { message = "Không tìm thấy nhân viên" });

        var oldWarehouseName = staff.WarehouseId.HasValue
            ? (await _context.Warehouses.FindAsync(staff.WarehouseId))?.Name
            : null;

        staff.WarehouseId = warehouseId;
        staff.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = oldWarehouseName != null
                ? $"Đã chuyển nhân viên {staff.User?.FullName ?? staff.EmployeeCode} từ '{oldWarehouseName}' sang '{warehouse.Name}'"
                : $"Đã gán nhân viên {staff.User?.FullName ?? staff.EmployeeCode} vào kho '{warehouse.Name}'",
            staffMemberId = staff.Id,
            warehouseId = warehouse.Id
        });
    }

    /// <summary>
    /// Transfer a staff member from this warehouse to another warehouse
    /// </summary>
    [HttpPost("{warehouseId:guid}/staff/transfer")]
    public async Task<IActionResult> TransferStaff(Guid warehouseId, [FromBody] TransferStaffRequest request)
    {
        var sourceWarehouse = await _context.Warehouses.FindAsync(warehouseId);
        if (sourceWarehouse == null)
            return NotFound(new { message = "Không tìm thấy kho hàng nguồn" });

        var targetWarehouse = await _context.Warehouses.FindAsync(request.TargetWarehouseId);
        if (targetWarehouse == null)
            return NotFound(new { message = "Không tìm thấy kho hàng đích" });

        if (!targetWarehouse.IsActive)
            return BadRequest(new { message = "Kho hàng đích đã bị vô hiệu hóa" });

        if (warehouseId == request.TargetWarehouseId)
            return BadRequest(new { message = "Kho hàng nguồn và đích không được trùng nhau" });

        var staff = await _context.StaffMembers
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == request.StaffMemberId && s.WarehouseId == warehouseId);

        if (staff == null)
            return NotFound(new { message = "Nhân viên không thuộc kho hàng này" });

        staff.WarehouseId = request.TargetWarehouseId;
        staff.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Đã chuyển nhân viên {staff.User?.FullName ?? staff.EmployeeCode} từ '{sourceWarehouse.Name}' sang '{targetWarehouse.Name}'",
            staffMemberId = staff.Id,
            fromWarehouseId = warehouseId,
            toWarehouseId = request.TargetWarehouseId
        });
    }

    /// <summary>
    /// Create a new staff account and assign to this warehouse
    /// </summary>
    [HttpPost("{warehouseId:guid}/staff/create")]
    public async Task<IActionResult> CreateStaffForWarehouse(Guid warehouseId, [FromBody] CreateWarehouseStaffRequest request)
    {
        var warehouse = await _context.Warehouses.FindAsync(warehouseId);
        if (warehouse == null)
            return NotFound(new { message = "Không tìm thấy kho hàng" });

        if (!warehouse.IsActive)
            return BadRequest(new { message = "Kho hàng đã bị vô hiệu hóa" });

        // Check email uniqueness
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (existingUser != null)
            return BadRequest(new { message = $"Email '{request.Email}' đã tồn tại trong hệ thống" });

        // Check employee code uniqueness
        if (!string.IsNullOrEmpty(request.EmployeeCode))
        {
            var codeExists = await _context.StaffMembers.AnyAsync(s => s.EmployeeCode == request.EmployeeCode);
            if (codeExists)
                return BadRequest(new { message = $"Mã nhân viên '{request.EmployeeCode}' đã tồn tại" });
        }

        // Create user in Supabase Auth
        Guid supabaseUserId;
        try
        {
            // Get Supabase client from DI
            var supabaseClient = HttpContext.RequestServices.GetRequiredService<Supabase.Client>();
            var session = await supabaseClient.Auth.SignUp(request.Email, request.Password);

            if (session?.User == null || string.IsNullOrEmpty(session.User.Id))
                return BadRequest(new { message = "Không thể tạo tài khoản. Vui lòng kiểm tra email và mật khẩu hợp lệ." });

            supabaseUserId = Guid.Parse(session.User.Id);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Lỗi tạo tài khoản: {ex.Message}" });
        }

        // Get default membership tier
        var defaultTier = await _context.MemberTiers.FirstOrDefaultAsync(mt => mt.Id == 1);

        // Create user record
        var user = new User
        {
            Id = supabaseUserId,
            Email = request.Email,
            FullName = request.FullName,
            Role = Models.Enums.UserRole.staff,
            PhoneNumber = request.PhoneNumber,
            TierId = defaultTier?.Id ?? 1,
            IsActive = true,
            LoyaltyPoints = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        // Auto-generate employee code if not provided
        var employeeCode = request.EmployeeCode;
        if (string.IsNullOrEmpty(employeeCode))
        {
            var staffCount = await _context.StaffMembers.CountAsync();
            employeeCode = $"EMP{(staffCount + 1):D4}";
        }

        // Create staff member linked to this warehouse
        var staffMember = new StaffMember
        {
            Id = Guid.NewGuid(),
            UserId = supabaseUserId,
            EmployeeCode = employeeCode,
            Department = request.Department ?? "General",
            Position = request.Position ?? GetPositionLabel(request.StaffPositionEnum),
            StaffPositionEnum = request.StaffPositionEnum ?? StaffPosition.WarehouseStaff,
            WarehouseId = warehouseId,
            CanApproveReceipts = request.CanApproveReceipts,
            CanAdjustInventory = request.CanAdjustInventory,
            CanOverrideFifo = request.CanOverrideFifo,
            HireDate = DateTime.UtcNow,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.StaffMembers.Add(staffMember);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWarehouseStaff), new { warehouseId }, new
        {
            message = $"Đã tạo tài khoản nhân viên '{request.FullName ?? request.Email}' và gán vào kho '{warehouse.Name}'",
            staffMemberId = staffMember.Id,
            userId = user.Id,
            employeeCode = staffMember.EmployeeCode,
            warehouseId = warehouse.Id
        });
    }

    /// <summary>
    /// Remove staff member from warehouse (unassign, not delete)
    /// </summary>
    [HttpDelete("{warehouseId:guid}/staff/{staffMemberId:guid}")]
    public async Task<IActionResult> RemoveStaffFromWarehouse(Guid warehouseId, Guid staffMemberId)
    {
        var staff = await _context.StaffMembers
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == staffMemberId && s.WarehouseId == warehouseId);

        if (staff == null)
            return NotFound(new { message = "Nhân viên không thuộc kho hàng này" });

        staff.WarehouseId = null;
        staff.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Đã gỡ nhân viên {staff.User?.FullName ?? staff.EmployeeCode} khỏi kho hàng",
            staffMemberId = staff.Id
        });
    }

    /// <summary>
    /// Update staff member permissions within warehouse
    /// </summary>
    [HttpPut("{warehouseId:guid}/staff/{staffMemberId:guid}")]
    public async Task<IActionResult> UpdateWarehouseStaff(Guid warehouseId, Guid staffMemberId, [FromBody] UpdateWarehouseStaffRequest request)
    {
        var staff = await _context.StaffMembers
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == staffMemberId && s.WarehouseId == warehouseId);

        if (staff == null)
            return NotFound(new { message = "Nhân viên không thuộc kho hàng này" });

        if (request.Department != null) staff.Department = request.Department;
        if (request.Position != null) staff.Position = request.Position;
        if (request.StaffPositionEnum.HasValue)
        {
            staff.StaffPositionEnum = request.StaffPositionEnum.Value;
            // Auto-sync the display position label
            staff.Position = GetPositionLabel(request.StaffPositionEnum.Value);
        }
        if (request.CanApproveReceipts.HasValue) staff.CanApproveReceipts = request.CanApproveReceipts.Value;
        if (request.CanAdjustInventory.HasValue) staff.CanAdjustInventory = request.CanAdjustInventory.Value;
        if (request.CanOverrideFifo.HasValue) staff.CanOverrideFifo = request.CanOverrideFifo.Value;
        if (request.IsActive.HasValue) staff.IsActive = request.IsActive.Value;

        staff.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Đã cập nhật thông tin nhân viên {staff.User?.FullName ?? staff.EmployeeCode}",
            staffMemberId = staff.Id
        });
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
    public StaffPosition? StaffPositionEnum { get; set; }
    public string? StaffPositionLabel { get; set; }
    public bool CanAccessSystem { get; set; }
    public bool CanApproveReceipts { get; set; }
    public bool CanAdjustInventory { get; set; }
    public DateTime? HireDate { get; set; }
    public bool IsActive { get; set; }
}

public class WarehouseStaffDetailDto : WarehouseStaffDto
{
    public string? AvatarUrl { get; set; }
    public bool CanOverrideFifo { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CurrentWarehouseId { get; set; }
    public string? CurrentWarehouseName { get; set; }
}

public class AssignStaffRequest
{
    public Guid StaffMemberId { get; set; }
}

public class TransferStaffRequest
{
    public Guid StaffMemberId { get; set; }
    public Guid TargetWarehouseId { get; set; }
}

public class CreateWarehouseStaffRequest
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.EmailAddress]
    public string Email { get; set; } = null!;

    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.MinLength(6)]
    public string Password { get; set; } = null!;

    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? EmployeeCode { get; set; }
    public string? Department { get; set; }
    public string? Position { get; set; }
    public StaffPosition? StaffPositionEnum { get; set; }
    public bool CanApproveReceipts { get; set; } = false;
    public bool CanAdjustInventory { get; set; } = false;
    public bool CanOverrideFifo { get; set; } = false;
}

public class UpdateWarehouseStaffRequest
{
    public string? Department { get; set; }
    public string? Position { get; set; }
    public StaffPosition? StaffPositionEnum { get; set; }
    public bool? CanApproveReceipts { get; set; }
    public bool? CanAdjustInventory { get; set; }
    public bool? CanOverrideFifo { get; set; }
    public bool? IsActive { get; set; }
}
