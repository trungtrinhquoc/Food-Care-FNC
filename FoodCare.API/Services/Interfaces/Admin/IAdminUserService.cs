using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Users;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminUserService
{
    /// <summary>
    /// Get paginated list of users with filters
    /// </summary>
    Task<PagedResult<AdminUserDto>> GetUsersAsync(AdminUserFilterDto filter);
    
    /// <summary>
    /// Get user by ID with full details
    /// </summary>
    Task<AdminUserDto?> GetUserByIdAsync(Guid id);
    
    /// <summary>
    /// Get user statistics for dashboard
    /// </summary>
    Task<UserStatsDto> GetUserStatsAsync();
    
    /// <summary>
    /// Create a new user
    /// </summary>
    Task<AdminUserDto> CreateUserAsync(CreateUserDto dto);
    
    /// <summary>
    /// Update user information
    /// </summary>
    Task<AdminUserDto?> UpdateUserAsync(Guid id, UpdateUserDto dto);
    
    /// <summary>
    /// Change user password (admin override)
    /// </summary>
    Task<bool> ChangePasswordAsync(Guid id, AdminChangePasswordDto dto);
    
    /// <summary>
    /// Toggle user active status
    /// </summary>
    Task<AdminUserDto?> ToggleActiveStatusAsync(Guid id);
    
    /// <summary>
    /// Delete user (soft delete - set inactive)
    /// </summary>
    Task<bool> DeleteUserAsync(Guid id);
    
    /// <summary>
    /// Get all member tiers for dropdown
    /// </summary>
    Task<List<MemberTierDto>> GetMemberTiersAsync();
}

/// <summary>
/// DTO for member tier dropdown
/// </summary>
public class MemberTierDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int MinPoint { get; set; }
    public decimal? DiscountPercent { get; set; }
}
