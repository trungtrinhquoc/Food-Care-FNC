using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.DTOs.Admin.Users;

/// <summary>
/// DTO for displaying user in admin panel
/// </summary>
public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string? FullName { get; set; }
    public string Role { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public int? TierId { get; set; }
    public string? TierName { get; set; }
    public int? LoyaltyPoints { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Statistics
    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public int TotalSubscriptions { get; set; }
    public int TotalReviews { get; set; }
}

/// <summary>
/// DTO for creating a new user
/// </summary>
public class CreateUserDto
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? FullName { get; set; }
    public string Role { get; set; } = "customer";
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
}

/// <summary>
/// DTO for updating user
/// </summary>
public class UpdateUserDto
{
    public string? FullName { get; set; }
    public string? Role { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public int? TierId { get; set; }
    public int? LoyaltyPoints { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// DTO for changing user password (admin)
/// </summary>
public class AdminChangePasswordDto
{
    public string NewPassword { get; set; } = null!;
}

/// <summary>
/// Filter options for user list
/// </summary>
public class AdminUserFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
    public int? TierId { get; set; }
    public string? SortBy { get; set; } = "createdAt";
    public bool SortDesc { get; set; } = true;
}

/// <summary>
/// User statistics for dashboard
/// </summary>
public class UserStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public Dictionary<string, int> UsersByRole { get; set; } = new();
    public Dictionary<string, int> UsersByTier { get; set; } = new();
    public int NewUsersThisMonth { get; set; }
}
