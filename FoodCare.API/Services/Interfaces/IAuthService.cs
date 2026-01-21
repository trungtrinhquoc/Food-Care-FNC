using FoodCare.API.Models.DTOs.Auth;

namespace FoodCare.API.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<AuthResponseDto> GoogleAuthAsync(GoogleAuthRequestDto request);
    Task<UserDto?> GetUserByIdAsync(Guid userId);
    
    // Email Verification
    Task<bool> VerifyEmailAsync(string token);
    Task ResendVerificationEmailAsync(string email);
    
    // Password Reset
    Task RequestPasswordResetAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
}
