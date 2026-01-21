using System.ComponentModel.DataAnnotations;

namespace FoodCare.API.Models.DTOs.Auth;

public class RegisterRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = null!;

    [Required]
    public string FullName { get; set; } = null!;

    public string? PhoneNumber { get; set; }
}

public class LoginRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}

public class GoogleAuthRequestDto
{
    public string IdToken { get; set; } = null!;
}

public class AuthResponseDto
{
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
    public UserDto? User { get; set; }
    public string? Message { get; set; }
}

public class ResendVerificationRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
}

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
}

public class ResetPasswordRequest
{
    [Required]
    public string Token { get; set; } = null!;
    
    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = null!;
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "customer";
    public int? TierId { get; set; }
    public int? LoyaltyPoints { get; set; }
    public bool? IsActive { get; set; }
    public MemberTierDto? MemberTier { get; set; }
}

public class MemberTierDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int MinPoint { get; set; }
    public decimal DiscountPercent { get; set; }
}
