using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Subscriptions;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations;

public class SubscriptionReminderService : ISubscriptionReminderService
{
    private readonly FoodCareDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IMapper _mapper;
    private readonly ILogger<SubscriptionReminderService> _logger;
    private const int REMINDER_DAYS_BEFORE = 3; // Gửi email 3 ngày trước
    private const int TOKEN_EXPIRY_DAYS = 7; // Token hết hạn sau 7 ngày

    public SubscriptionReminderService(
        FoodCareDbContext context,
        IEmailService emailService,
        ISubscriptionService subscriptionService,
        IMapper mapper,
        ILogger<SubscriptionReminderService> logger)
    {
        _context = context;
        _emailService = emailService;
        _subscriptionService = subscriptionService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<int> SendPendingRemindersAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var targetDate = today.AddDays(REMINDER_DAYS_BEFORE);

        _logger.LogInformation("Checking subscriptions for reminders. Target date: {TargetDate}", targetDate);

        // Lấy tất cả subscriptions active có NextDeliveryDate = targetDate
        var subscriptions = await _context.Subscriptions
            .Include(s => s.Product)
            .Include(s => s.User)
            .Where(s => s.Status == SubStatus.active && s.NextDeliveryDate == targetDate)
            .ToListAsync();

        _logger.LogInformation("Found {Count} subscriptions to send reminders", subscriptions.Count);

        int sentCount = 0;

        foreach (var subscription in subscriptions)
        {
            try
            {
                // Check xem đã gửi reminder cho delivery date này chưa
                var existingConfirmation = await _context.SubscriptionConfirmations
                    .FirstOrDefaultAsync(sc => 
                        sc.SubscriptionId == subscription.Id && 
                        sc.ScheduledDeliveryDate == subscription.NextDeliveryDate);

                if (existingConfirmation != null)
                {
                    _logger.LogInformation("Reminder already sent for subscription {SubscriptionId}", subscription.Id);
                    continue;
                }

                // Tạo confirmation token
                var token = GenerateSecureToken();
                var confirmation = new SubscriptionConfirmation
                {
                    Id = Guid.NewGuid(),
                    SubscriptionId = subscription.Id,
                    Token = token,
                    ScheduledDeliveryDate = subscription.NextDeliveryDate,
                    IsConfirmed = false,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(TOKEN_EXPIRY_DAYS)
                };

                _context.SubscriptionConfirmations.Add(confirmation);
                await _context.SaveChangesAsync();

                // Gửi email
                if (subscription.User != null && subscription.Product != null)
                {
                    await _emailService.SendSubscriptionReminderAsync(
                        subscription.User.Email,
                        subscription.User.FullName ?? "Khách hàng",
                        subscription.Product.Name,
                        subscription.NextDeliveryDate,
                        token
                    );

                    sentCount++;
                    _logger.LogInformation("Sent reminder for subscription {SubscriptionId} to {Email}", 
                        subscription.Id, subscription.User.Email);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reminder for subscription {SubscriptionId}", subscription.Id);
            }
        }

        _logger.LogInformation("Sent {SentCount} reminders successfully", sentCount);
        return sentCount;
    }

    public async Task<SubscriptionConfirmationDto?> GetConfirmationDetailsAsync(string token)
    {
        var confirmation = await _context.SubscriptionConfirmations
            .Include(sc => sc.Subscription)
                .ThenInclude(s => s!.Product)
            .FirstOrDefaultAsync(sc => sc.Token == token);

        if (confirmation == null)
        {
            return null;
        }

        var isExpired = DateTime.UtcNow > confirmation.ExpiresAt;
        var isProcessed = confirmation.IsConfirmed;

        var product = confirmation.Subscription?.Product;
        var productImage = product?.Images != null 
            ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(product.Images.ToString() ?? "[]")?.FirstOrDefault()
            : null;

        return new SubscriptionConfirmationDto
        {
            SubscriptionId = confirmation.SubscriptionId,
            ProductName = product?.Name ?? "Unknown Product",
            ProductImage = productImage,
            ScheduledDeliveryDate = confirmation.ScheduledDeliveryDate,
            Frequency = confirmation.Subscription?.Frequency.ToString() ?? "Unknown",
            Quantity = confirmation.Subscription?.Quantity ?? 1,
            TotalAmount = (product?.BasePrice ?? 0) * (confirmation.Subscription?.Quantity ?? 1),
            IsExpired = isExpired,
            IsAlreadyProcessed = isProcessed
        };
    }

    public async Task<bool> ProcessConfirmationAsync(ProcessConfirmationRequest request)
    {
        var confirmation = await _context.SubscriptionConfirmations
            .Include(sc => sc.Subscription)
            .FirstOrDefaultAsync(sc => sc.Token == request.Token);

        if (confirmation == null)
        {
            _logger.LogWarning("Confirmation token not found: {Token}", request.Token);
            return false;
        }

        // Validate token chưa hết hạn
        if (DateTime.UtcNow > confirmation.ExpiresAt)
        {
            _logger.LogWarning("Confirmation token expired: {Token}", request.Token);
            return false;
        }

        // Validate chưa được process
        if (confirmation.IsConfirmed)
        {
            _logger.LogWarning("Confirmation already processed: {Token}", request.Token);
            return false;
        }

        // Xử lý theo action
        bool success = false;
        switch (request.Action.ToLower())
        {
            case "continue":
                // Không làm gì, subscription tiếp tục bình thường
                success = true;
                _logger.LogInformation("Customer confirmed to continue subscription {SubscriptionId}", 
                    confirmation.SubscriptionId);
                break;

            case "pause":
                if (request.PauseUntil.HasValue)
                {
                    success = await _subscriptionService.PauseSubscriptionAsync(
                        confirmation.SubscriptionId, 
                        request.PauseUntil.Value);
                    _logger.LogInformation("Customer paused subscription {SubscriptionId} until {PauseUntil}", 
                        confirmation.SubscriptionId, request.PauseUntil.Value);
                }
                else
                {
                    _logger.LogWarning("Pause action requires PauseUntil date");
                    return false;
                }
                break;

            case "cancel":
                var subscription = await _context.Subscriptions.FindAsync(confirmation.SubscriptionId);
                if (subscription != null)
                {
                    subscription.Status = SubStatus.cancelled;
                    subscription.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    success = true;
                    _logger.LogInformation("Customer cancelled subscription {SubscriptionId}", 
                        confirmation.SubscriptionId);
                }
                break;

            default:
                _logger.LogWarning("Invalid action: {Action}", request.Action);
                return false;
        }

        if (success)
        {
            // Mark confirmation as processed
            confirmation.IsConfirmed = true;
            confirmation.CustomerResponse = request.Action.ToLower();
            confirmation.RespondedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return success;
    }

    public async Task<SubscriptionReminderStatsDto> GetStatisticsAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var stats = new SubscriptionReminderStatsDto
        {
            TotalActiveSubscriptions = await _context.Subscriptions
                .CountAsync(s => s.Status == SubStatus.active),

            RemindersSentToday = await _context.SubscriptionConfirmations
                .CountAsync(sc => sc.CreatedAt.Date == DateTime.UtcNow.Date),

            PendingConfirmations = await _context.SubscriptionConfirmations
                .CountAsync(sc => !sc.IsConfirmed && sc.ExpiresAt > DateTime.UtcNow),

            ConfirmedCount = await _context.SubscriptionConfirmations
                .CountAsync(sc => sc.IsConfirmed && sc.CustomerResponse == "continue"),

            PausedCount = await _context.SubscriptionConfirmations
                .CountAsync(sc => sc.IsConfirmed && sc.CustomerResponse == "pause"),

            CancelledCount = await _context.SubscriptionConfirmations
                .CountAsync(sc => sc.IsConfirmed && sc.CustomerResponse == "cancel")
        };

        return stats;
    }

    private string GenerateSecureToken()
    {
        var randomBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }
}
