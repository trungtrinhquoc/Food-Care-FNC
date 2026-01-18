using System.Net;
using System.Net.Mail;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendVerificationEmailAsync(string email, string token, string fullName)
        {
            var appUrl = _configuration["AppUrl"] ?? "http://localhost:5173";
            var verifyUrl = $"{appUrl}/verify-email?token={token}";

            var subject = "Xác nhận tài khoản Food & Care";
            var body = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🛒 Food & Care</h1>
            <p>Giao hàng định kỳ</p>
        </div>
        <div class=""content"">
            <h2>Xin chào {fullName}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Food & Care.</p>
            <p>Vui lòng click vào nút bên dưới để kích hoạt tài khoản của bạn:</p>
            <div style=""text-align: center;"">
                <a href=""{verifyUrl}"" class=""button"">Kích hoạt tài khoản</a>
            </div>
            <p style=""color: #6b7280; font-size: 14px;"">
                Hoặc copy link sau vào trình duyệt:<br>
                <a href=""{verifyUrl}"">{verifyUrl}</a>
            </p>
            <p style=""color: #ef4444; font-size: 14px;"">
                ⚠️ Link này sẽ hết hạn sau 24 giờ.
            </p>
        </div>
        <div class=""footer"">
            <p>© 2024 Food & Care. All rights reserved.</p>
            <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
        </div>
    </div>
</body>
</html>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPasswordResetEmailAsync(string email, string token)
        {
            var appUrl = _configuration["AppUrl"] ?? "http://localhost:5173";
            var resetUrl = $"{appUrl}/reset-password?token={token}";

            var subject = "Đặt lại mật khẩu Food & Care";
            var body = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🔐 Đặt lại mật khẩu</h1>
        </div>
        <div class=""content"">
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Food & Care.</p>
            <p>Click vào nút bên dưới để tạo mật khẩu mới:</p>
            <div style=""text-align: center;"">
                <a href=""{resetUrl}"" class=""button"">Đặt lại mật khẩu</a>
            </div>
            <p style=""color: #ef4444; font-size: 14px;"">
                ⚠️ Link này sẽ hết hạn sau 1 giờ.
            </p>
        </div>
        <div class=""footer"">
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
    </div>
</body>
</html>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendWelcomeEmailAsync(string email, string fullName)
        {
            var subject = "Chào mừng đến với Food & Care!";
            var body = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🎉 Chào mừng {fullName}!</h1>
        </div>
        <div class=""content"">
            <p>Tài khoản của bạn đã được kích hoạt thành công!</p>
            <p>Bạn có thể bắt đầu mua sắm và đặt hàng định kỳ ngay bây giờ.</p>
            <h3>Tính năng nổi bật:</h3>
            <ul>
                <li>🛒 Mua sắm thực phẩm tươi sống</li>
                <li>📦 Giao hàng định kỳ tự động</li>
                <li>💰 Tích điểm thành viên</li>
                <li>🎁 Ưu đãi độc quyền</li>
            </ul>
        </div>
    </div>
</body>
</html>";

            await SendEmailAsync(email, subject, body);
        }

        private async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var username = _configuration["Email:Username"];
                var password = _configuration["Email:Password"];
                var fromEmail = _configuration["Email:From"] ?? username;
                var fromName = _configuration["Email:FromName"] ?? "Food & Care";

                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    _logger.LogWarning("Email credentials not configured. Email not sent to {Email}", to);
                    // In development, just log instead of throwing
                    _logger.LogInformation("Email would be sent to {Email} with subject: {Subject}", to, subject);
                    return;
                }

                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(username, password)
                };

                var message = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                message.To.Add(to);

                await client.SendMailAsync(message);
                _logger.LogInformation("Email sent successfully to {Email}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", to);
                // Don't throw - email failures shouldn't break registration
            }
        }
    }
}
