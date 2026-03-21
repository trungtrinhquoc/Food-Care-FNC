using System.Net;
using System.Net.Mail;
using FoodCare.API.Services.Interfaces;
using SendGrid;
using SendGrid.Helpers.Mail;

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

        public async Task SendSubscriptionReminderAsync(string email, string fullName, string productName, DateOnly nextDeliveryDate, string confirmationToken)
        {
            var appUrl = _configuration["AppUrl"] ?? "http://localhost:5173";
            var continueUrl = $"{appUrl}/subscription-confirm?token={confirmationToken}&action=continue";
            var pauseUrl = $"{appUrl}/subscription-confirm?token={confirmationToken}&action=pause";
            var cancelUrl = $"{appUrl}/subscription-confirm?token={confirmationToken}&action=cancel";

            var subject = $"📦 Nhắc nhở đơn hàng định kỳ - {productName}";
            var body = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .product-info {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
        .actions {{ margin: 30px 0; }}
        .button {{ display: inline-block; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 8px 4px; font-weight: bold; text-align: center; min-width: 150px; }}
        .btn-continue {{ background: #10b981; color: white; }}
        .btn-pause {{ background: #f59e0b; color: white; }}
        .btn-cancel {{ background: #ef4444; color: white; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
        .highlight {{ color: #10b981; font-weight: bold; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>📦 Food & Care</h1>
            <p>Nhắc nhở đơn hàng định kỳ</p>
        </div>
        <div class=""content"">
            <h2>Xin chào {fullName}!</h2>
            <p>Đơn hàng định kỳ của bạn sắp được giao trong <span class=""highlight"">3 ngày tới</span>.</p>
            
            <div class=""product-info"">
                <h3>📋 Thông tin đơn hàng</h3>
                <p><strong>Sản phẩm:</strong> {productName}</p>
                <p><strong>Ngày giao dự kiến:</strong> {nextDeliveryDate:dd/MM/yyyy}</p>
            </div>

            <p>Bạn có muốn tiếp tục nhận đơn hàng này không?</p>

            <div class=""actions"" style=""text-align: center;"">
                <a href=""{continueUrl}"" class=""button btn-continue"">✅ Tiếp tục đặt hàng</a><br/>
                <a href=""{pauseUrl}"" class=""button btn-pause"">⏸️ Tạm dừng</a>
                <a href=""{cancelUrl}"" class=""button btn-cancel"">❌ Hủy đăng ký</a>
            </div>

            <p style=""color: #6b7280; font-size: 14px; margin-top: 30px;"">
                ℹ️ Nếu bạn không thực hiện hành động nào, đơn hàng sẽ tự động được tạo và giao đến bạn vào ngày dự kiến.
            </p>
        </div>
        <div class=""footer"">
            <p>© 2024 Food & Care. All rights reserved.</p>
            <p>Email này được gửi tự động. Vui lòng không trả lời email này.</p>
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
                // Try SendGrid first (works on Railway)
                var sendGridApiKey = _configuration["SendGrid:ApiKey"];
                
                if (!string.IsNullOrEmpty(sendGridApiKey))
                {
                    await SendViaSendGridAsync(to, subject, body, sendGridApiKey);
                    return;
                }

                // Fallback to SMTP (for local development)
                await SendViaSmtpAsync(to, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", to);
                // Don't throw - email failures shouldn't break registration
            }
        }

        private async Task SendViaSendGridAsync(string to, string subject, string body, string apiKey)
        {
            var fromEmail = _configuration["Email:From"] ?? "noreply@foodcare.com";
            var fromName = _configuration["Email:FromName"] ?? "Food & Care";

            var client = new SendGrid.SendGridClient(apiKey);
            var from = new SendGrid.Helpers.Mail.EmailAddress(fromEmail, fromName);
            var toAddress = new SendGrid.Helpers.Mail.EmailAddress(to);
            var msg = SendGrid.Helpers.Mail.MailHelper.CreateSingleEmail(
                from, 
                toAddress, 
                subject, 
                null, // plain text content
                body  // HTML content
            );

            var response = await client.SendEmailAsync(msg);
            
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email sent successfully via SendGrid to {Email}", to);
            }
            else
            {
                var responseBody = await response.Body.ReadAsStringAsync();
                _logger.LogError("SendGrid API error: {StatusCode} - {Body}", response.StatusCode, responseBody);
                throw new Exception($"SendGrid failed with status {response.StatusCode}");
            }
        }

        private async Task SendViaSmtpAsync(string to, string subject, string body)
        {
            var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var username = _configuration["Email:Username"];
            var password = _configuration["Email:Password"];
            var fromEmail = _configuration["Email:From"] ?? username
                ?? throw new InvalidOperationException("Email:From or Email:Username is not configured.");
            var fromName = _configuration["Email:FromName"] ?? "Food & Care";

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                _logger.LogWarning("Email credentials not configured. Email not sent to {Email}", to);
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
            _logger.LogInformation("Email sent successfully via SMTP to {Email}", to);
        }
    }
}
