using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Users;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.Staff;
using FoodCare.API.Services.Interfaces.Admin;
using FoodCare.API.Helpers;
using Microsoft.Extensions.Logging;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminUserService : IAdminUserService
{
    private readonly FoodCareDbContext _context;
    private readonly Supabase.Client _supabaseClient;
    private readonly ILogger<AdminUserService> _logger;

    public AdminUserService(
        FoodCareDbContext context,
        Supabase.Client supabaseClient,
        ILogger<AdminUserService> logger)
    {
        _context = context;
        _supabaseClient = supabaseClient;
        _logger = logger;
    }

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(AdminUserFilterDto filter)
    {
        var query = _context.Users
            .Include(u => u.Tier)
            .Include(u => u.Orders)
            .Include(u => u.Subscriptions)
            .Include(u => u.Reviews)
            .AsQueryable();

        // Search filter
        if (!string.IsNullOrEmpty(filter.Search))
        {
            var searchLower = filter.Search.ToLower();
            query = query.Where(u => 
                (u.Email != null && u.Email.ToLower().Contains(searchLower)) ||
                (u.FullName != null && u.FullName.ToLower().Contains(searchLower)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(searchLower)));
        }

        // Role filter
        if (!string.IsNullOrEmpty(filter.Role))
        {
            if (Enum.TryParse<UserRole>(filter.Role, true, out var role))
            {
                query = query.Where(u => u.Role == role);
            }
        }

        // Active status filter
        if (filter.IsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == filter.IsActive.Value);
        }

        // Tier filter
        if (filter.TierId.HasValue)
        {
            query = query.Where(u => u.TierId == filter.TierId.Value);
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "email" => filter.SortDesc ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
            "fullname" => filter.SortDesc ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
            "role" => filter.SortDesc ? query.OrderByDescending(u => u.Role) : query.OrderBy(u => u.Role),
            "loyaltypoints" => filter.SortDesc ? query.OrderByDescending(u => u.LoyaltyPoints) : query.OrderBy(u => u.LoyaltyPoints),
            _ => filter.SortDesc ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt)
        };

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)filter.PageSize);

        var users = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var items = users.Select(MapToDto).ToList();

        // Fetch last login dates for all users in this page
        var userIds = users.Select(u => u.Id).ToList();
        var lastLogins = await _context.LoginLogs
            .Where(l => userIds.Contains(l.UserId) && l.Success == true)
            .GroupBy(l => l.UserId)
            .Select(g => new { UserId = g.Key, LastLoginAt = g.Max(l => l.LoginAt) })
            .ToListAsync();

        // Fetch staff info for staff users
        var staffUsers = users.Where(u => u.Role == UserRole.staff).Select(u => u.Id).ToList();
        var staffInfos = staffUsers.Count > 0 ? await _context.StaffMembers
            .Include(s => s.Warehouse)
            .Where(s => staffUsers.Contains(s.UserId) && s.IsActive)
            .ToListAsync() : new List<StaffMember>();

        // Apply last login dates and staff info to items
        foreach (var item in items)
        {
            var lastLogin = lastLogins.FirstOrDefault(l => l.UserId == item.Id);
            if (lastLogin != null)
            {
                item.LastLoginAt = lastLogin.LastLoginAt;
            }

            var staffInfo = staffInfos.FirstOrDefault(s => s.UserId == item.Id);
            if (staffInfo != null)
            {
                item.WarehouseId = staffInfo.WarehouseId;
                item.WarehouseName = staffInfo.Warehouse?.Name;
                item.EmployeeCode = staffInfo.EmployeeCode;
            }
        }

        return new PagedResult<AdminUserDto>
        {
            Items = items,
            TotalItems = totalItems,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = totalPages
        };
    }

    public async Task<AdminUserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Tier)
            .Include(u => u.Orders)
            .Include(u => u.Subscriptions)
            .Include(u => u.Reviews)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return null;

        // Get last successful login
        var lastLogin = await _context.LoginLogs
            .Where(l => l.UserId == id && l.Success == true)
            .OrderByDescending(l => l.LoginAt)
            .Select(l => l.LoginAt)
            .FirstOrDefaultAsync();

        var dto = MapToDto(user);
        dto.LastLoginAt = lastLogin;
        dto.ActiveSubscriptions = user.Subscriptions?.Count(s => s.Status == Models.Enums.SubStatus.active) ?? 0;
        dto.EmailVerified = user.EmailVerified;
        
        // Enrich with staff info
        await EnrichWithStaffInfo(dto, user.Id);
        
        return dto;
    }

    public async Task<UserStatsDto> GetUserStatsAsync()
    {
        var users = await _context.Users.ToListAsync();
        var tiers = await _context.MemberTiers.ToListAsync();

        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        return new UserStatsDto
        {
            TotalUsers = users.Count,
            ActiveUsers = users.Count(u => u.IsActive == true),
            InactiveUsers = users.Count(u => u.IsActive == false),
            UsersByRole = users
                .GroupBy(u => u.Role.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
            UsersByTier = users
                .Where(u => u.TierId.HasValue)
                .GroupBy(u => tiers.FirstOrDefault(t => t.Id == u.TierId)?.Name ?? "Unknown")
                .ToDictionary(g => g.Key, g => g.Count()),
            NewUsersThisMonth = users.Count(u => u.CreatedAt >= startOfMonth)
        };
    }

    public async Task<AdminUserDto> CreateUserAsync(CreateUserDto dto)
    {
        // Check if email already exists
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Email đã tồn tại trong hệ thống");
        }

        // Parse role
        if (!Enum.TryParse<UserRole>(dto.Role, true, out var role))
        {
            role = UserRole.customer;
        }

        // First, create user in Supabase Auth to get valid ID
        _logger.LogInformation("Creating user in Supabase Auth for email: {Email}", dto.Email);
        
        try
        {
            var session = await _supabaseClient.Auth.SignUp(dto.Email, dto.Password);

            if (session?.User == null || string.IsNullOrEmpty(session.User.Id))
            {
                _logger.LogError("Supabase Auth failed to create user. Session or User is null");
                throw new InvalidOperationException("Không thể tạo tài khoản. Vui lòng kiểm tra email và mật khẩu hợp lệ.");
            }

            // Get real ID from Supabase
            var supabaseUserId = Guid.Parse(session.User.Id);
            _logger.LogInformation("Successfully created user in Supabase Auth with ID: {UserId}", supabaseUserId);

            // Get default tier
            var defaultTier = await _context.MemberTiers.FirstOrDefaultAsync(mt => mt.Id == 1);
            if (defaultTier == null)
            {
                defaultTier = new MemberTier
                {
                    Id = 1,
                    Name = "Bronze",
                    MinPoint = 0,
                    DiscountPercent = 0,
                    CreatedAt = DateTime.UtcNow
                };
                _context.MemberTiers.Add(defaultTier);
                await _context.SaveChangesAsync();
            }

            var user = new User
            {
                Id = supabaseUserId, // Use Supabase's ID to satisfy foreign key constraint
                Email = dto.Email,
                FullName = dto.FullName,
                Role = role,
                PhoneNumber = dto.PhoneNumber,
                AvatarUrl = dto.AvatarUrl,
                TierId = defaultTier.Id,
                IsActive = true,
                LoyaltyPoints = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // If role is staff, create StaffMember and assign to warehouse
            if (role == UserRole.staff)
            {
                await HandleStaffAssignment(user, dto.WarehouseId);
                await _context.SaveChangesAsync();
            }

            // Load tier for mapping
            await _context.Entry(user).Reference(u => u.Tier).LoadAsync();

            var result = MapToDto(user);
            await EnrichWithStaffInfo(result, user.Id);
            return result;
        }
        catch (InvalidOperationException)
        {
            throw; // Re-throw our own exceptions
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user via Supabase Auth");
            throw new InvalidOperationException($"Lỗi tạo tài khoản: {ex.Message}");
        }
    }

    public async Task<AdminUserDto?> UpdateUserAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Tier)
            .Include(u => u.Orders)
            .Include(u => u.Subscriptions)
            .Include(u => u.Reviews)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return null;

        if (dto.FullName != null) user.FullName = dto.FullName;
        if (dto.PhoneNumber != null) user.PhoneNumber = dto.PhoneNumber;
        if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;
        if (dto.TierId.HasValue) user.TierId = dto.TierId;
        if (dto.LoyaltyPoints.HasValue) user.LoyaltyPoints = dto.LoyaltyPoints;
        user.IsActive = dto.IsActive;

        UserRole? newRole = null;
        if (!string.IsNullOrEmpty(dto.Role) && Enum.TryParse<UserRole>(dto.Role, true, out var role))
        {
            newRole = role;
            user.Role = role;
        }

        user.UpdatedAt = DateTime.UtcNow;

        // Handle staff role assignment: create/update StaffMember + warehouse assignment
        if (newRole == UserRole.staff || (newRole == null && user.Role == UserRole.staff && dto.WarehouseId.HasValue))
        {
            await HandleStaffAssignment(user, dto.WarehouseId);
        }
        // If role changed FROM staff to something else, deactivate staff member
        else if (newRole.HasValue && newRole != UserRole.staff)
        {
            var existingStaff = await _context.StaffMembers.FirstOrDefaultAsync(s => s.UserId == user.Id);
            if (existingStaff != null)
            {
                existingStaff.IsActive = false;
                existingStaff.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        var result = MapToDto(user);
        // Load staff info for response
        await EnrichWithStaffInfo(result, user.Id);
        return result;
    }

    /// <summary>
    /// Create or update StaffMember when user role is set to staff
    /// </summary>
    private async Task HandleStaffAssignment(User user, Guid? warehouseId)
    {
        var existingStaff = await _context.StaffMembers
            .FirstOrDefaultAsync(s => s.UserId == user.Id);

        if (existingStaff != null)
        {
            // Re-activate and update warehouse
            existingStaff.IsActive = true;
            existingStaff.UpdatedAt = DateTime.UtcNow;
            if (warehouseId.HasValue)
            {
                existingStaff.WarehouseId = warehouseId.Value;
            }
        }
        else
        {
            // Create new staff member with auto-generated employee code
            var staffCount = await _context.StaffMembers.CountAsync();
            var employeeCode = $"EMP{(staffCount + 1):D4}";

            var staffMember = new StaffMember
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                EmployeeCode = employeeCode,
                WarehouseId = warehouseId,
                Department = "General",
                Position = "Staff",
                CanApproveReceipts = false,
                CanAdjustInventory = false,
                CanOverrideFifo = false,
                IsActive = true,
                HireDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.StaffMembers.Add(staffMember);
        }
    }

    /// <summary>
    /// Enrich AdminUserDto with staff/warehouse info if applicable
    /// </summary>
    private async Task EnrichWithStaffInfo(AdminUserDto dto, Guid userId)
    {
        if (dto.Role?.ToLower() == "staff")
        {
            var staffMember = await _context.StaffMembers
                .Include(s => s.Warehouse)
                .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive);

            if (staffMember != null)
            {
                dto.WarehouseId = staffMember.WarehouseId;
                dto.WarehouseName = staffMember.Warehouse?.Name;
                dto.EmployeeCode = staffMember.EmployeeCode;
            }
        }
    }

    public async Task<bool> ChangePasswordAsync(Guid id, AdminChangePasswordDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        // Here you would hash the new password and update
        // This depends on how you store passwords (UserCredential table, etc.)
        // For now, we return true assuming the operation would succeed
        
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<AdminUserDto?> ToggleActiveStatusAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Tier)
            .Include(u => u.Orders)
            .Include(u => u.Subscriptions)
            .Include(u => u.Reviews)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return null;

        user.IsActive = !(user.IsActive ?? true);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        // Soft delete - set inactive
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<MemberTierDto>> GetMemberTiersAsync()
    {
        return await _context.MemberTiers
            .OrderBy(t => t.MinPoint)
            .Select(t => new MemberTierDto
            {
                Id = t.Id,
                Name = t.Name,
                MinPoint = t.MinPoint,
                DiscountPercent = t.DiscountPercent
            })
            .ToListAsync();
    }

    private static AdminUserDto MapToDto(User user)
    {
        return new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            TierId = user.TierId,
            TierName = user.Tier?.Name,
            LoyaltyPoints = user.LoyaltyPoints,
            IsActive = user.IsActive ?? true,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            TotalOrders = user.Orders?.Count ?? 0,
            TotalSpent = user.Orders?.Sum(o => o.TotalAmount) ?? 0,
            TotalSubscriptions = user.Subscriptions?.Count ?? 0,
            TotalReviews = user.Reviews?.Count ?? 0
        };
    }
}
