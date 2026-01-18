namespace FoodCare.API.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendVerificationEmailAsync(string email, string token, string fullName);
        Task SendPasswordResetEmailAsync(string email, string token);
        Task SendWelcomeEmailAsync(string email, string fullName);
    }
}
