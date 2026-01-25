using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin.Subscriptions;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminSubscriptionService : IAdminSubscriptionService
{
    private readonly FoodCareDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<AdminSubscriptionService> _logger;

    public AdminSubscriptionService(
        FoodCareDbContext context,
        IEmailService emailService,
        ILogger<AdminSubscriptionService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<PaginatedSubscriptionsResponse> GetAllSubscriptionsAsync(SubscriptionFilters filters)
    {
        var query = _context.Subscriptions
            .Include(s => s.User)
            .Include(s => s.Product)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filters.Status))
        {
            if (Enum.TryParse<SubStatus>(filters.Status, true, out var status))
            {
                query = query.Where(s => s.Status == status);
            }
        }

        if (!string.IsNullOrEmpty(filters.Frequency))
        {
            if (Enum.TryParse<SubFrequency>(filters.Frequency, true, out var frequency))
            {
                query = query.Where(s => s.Frequency == frequency);
            }
        }

        if (!string.IsNullOrEmpty(filters.SearchTerm))
        {
            var searchLower = filters.SearchTerm.ToLower();
            query = query.Where(s =>
                (s.User!.FullName != null && s.User.FullName.ToLower().Contains(searchLower)) ||
                s.User.Email.ToLower().Contains(searchLower) ||
                (s.User.PhoneNumber != null && s.User.PhoneNumber.Contains(searchLower))
            );
        }

        if (filters.StartDate.HasValue)
        {
            var startDate = DateOnly.FromDateTime(filters.StartDate.Value);
            query = query.Where(s => s.StartDate >= startDate);
        }

        if (filters.EndDate.HasValue)
        {
            var endDate = DateOnly.FromDateTime(filters.EndDate.Value);
            query = query.Where(s => s.StartDate <= endDate);
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Fetch data first to avoid SQL translation issues with DateOnly.ToDateTime and null-propagation
        var subscriptionsData = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync();

        var subscriptions = subscriptionsData.Select(s => new AdminSubscriptionDto
        {
            Id = s.Id,
            UserId = s.UserId ?? Guid.Empty,
            CustomerName = s.User != null ? (s.User.FullName ?? "Khách hàng") : "Không xác định",
            CustomerEmail = s.User != null ? s.User.Email : "N/A",
            CustomerPhone = s.User?.PhoneNumber,
            ProductId = s.ProductId ?? Guid.Empty,
            ProductName = s.Product != null ? s.Product.Name : "Sản phẩm không tồn tại",
            ProductImage = s.Product?.Images,
            ProductPrice = s.Product != null ? s.Product.BasePrice : 0,
            Frequency = s.Frequency.ToString(),
            Quantity = s.Quantity ?? 1,
            DiscountPercent = s.DiscountPercent ?? 0,
            Status = s.Status.ToString(),
            StartDate = s.StartDate.HasValue ? s.StartDate.Value.ToDateTime(TimeOnly.MinValue) : DateTime.MinValue,
            NextDeliveryDate = s.NextDeliveryDate.ToDateTime(TimeOnly.MinValue),
            PauseUntil = s.PauseUntil.HasValue ? s.PauseUntil.Value.ToDateTime(TimeOnly.MinValue) : null,
            CreatedAt = s.CreatedAt ?? DateTime.UtcNow
        }).ToList();

        return new PaginatedSubscriptionsResponse
        {
            Subscriptions = subscriptions,
            TotalCount = totalCount,
            Page = filters.Page,
            PageSize = filters.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filters.PageSize)
        };
    }

    public async Task<AdminSubscriptionDetailDto?> GetSubscriptionDetailAsync(Guid subscriptionId)
    {
        var subscription = await _context.Subscriptions
            .Include(s => s.User)
            .Include(s => s.Product)
            .ThenInclude(p => p!.Category)
            .Include(s => s.ShippingAddress)
            .Include(s => s.PaymentMethod)
            .Include(s => s.Orders)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId);

        if (subscription == null)
            return null;

        // Calculate statistics
        var orders = subscription.Orders.Where(o => o.SubscriptionId == subscriptionId).ToList();
        var totalRevenue = orders.Sum(o => o.TotalAmount);
        var lastOrderDate = orders.Any() ? orders.Max(o => o.CreatedAt) : null;

        // Get reminder count from SubscriptionConfirmations
        var remindersSent = await _context.SubscriptionConfirmations
            .Where(sc => sc.SubscriptionId == subscriptionId)
            .CountAsync();
 
        var lastReminderSent = await _context.SubscriptionConfirmations
            .Where(sc => sc.SubscriptionId == subscriptionId)
            .OrderByDescending(sc => sc.CreatedAt)
            .Select(sc => (DateTime?)sc.CreatedAt)
            .FirstOrDefaultAsync();

        var detail = new AdminSubscriptionDetailDto
        {
            Id = subscription.Id,
            UserId = subscription.UserId ?? Guid.Empty,
            CustomerName = subscription.User != null ? (subscription.User.FullName ?? "Khách hàng") : "Không xác định",
            CustomerEmail = subscription.User?.Email ?? "N/A",
            CustomerPhone = subscription.User?.PhoneNumber,
            CustomerTier = subscription.User?.Tier?.Name,
            
            // Shipping Address
            ShippingStreet = subscription.ShippingAddress?.AddressLine1,
            ShippingWard = subscription.ShippingAddress?.Ward,
            ShippingDistrict = subscription.ShippingAddress?.District,
            ShippingCity = subscription.ShippingAddress?.City,
             ShippingFullAddress = subscription.ShippingAddress != null
                ? $"{subscription.ShippingAddress.AddressLine1}, {subscription.ShippingAddress.Ward}, {subscription.ShippingAddress.District}, {subscription.ShippingAddress.City}"
                : null,
            
            // Product Info
            ProductId = subscription.ProductId ?? Guid.Empty,
            ProductName = subscription.Product?.Name ?? "Sản phẩm không tồn tại",
            ProductDescription = subscription.Product?.Description,
            ProductImage = subscription.Product?.Images,
            ProductPrice = subscription.Product?.BasePrice ?? 0,
            ProductCategory = subscription.Product?.Category?.Name,
            
            // Subscription Info
            Frequency = subscription.Frequency.ToString(),
            Quantity = subscription.Quantity ?? 1,
            DiscountPercent = subscription.DiscountPercent ?? 0,
            Status = subscription.Status.ToString(),
            
            // Payment Info
            PaymentMethodType = subscription.PaymentMethod?.Provider,
            PaymentMethodDetails = subscription.PaymentMethod?.Last4Digits != null ? $"**** {subscription.PaymentMethod.Last4Digits}" : subscription.PaymentMethod?.Provider,
            
            // Dates
            StartDate = subscription.StartDate.HasValue ? subscription.StartDate.Value.ToDateTime(TimeOnly.MinValue) : DateTime.MinValue,
            NextDeliveryDate = subscription.NextDeliveryDate.ToDateTime(TimeOnly.MinValue),
            PauseUntil = subscription.PauseUntil.HasValue ? subscription.PauseUntil.Value.ToDateTime(TimeOnly.MinValue) : null,
            CreatedAt = subscription.CreatedAt ?? DateTime.UtcNow,
            UpdatedAt = subscription.UpdatedAt,
            
            // Statistics
            TotalOrdersCreated = orders.Count,
            TotalRevenue = totalRevenue,
            LastOrderDate = lastOrderDate,
            
            // Email History
            RemindersSent = remindersSent,
            LastReminderSent = lastReminderSent
        };

        return detail;
    }

    public async Task<SendReminderResponse> SendManualRemindersAsync(SendReminderRequest request)
    {
        var response = new SendReminderResponse();
        var errors = new List<string>();
        int successCount = 0;
        int failedCount = 0;

        foreach (var subscriptionId in request.SubscriptionIds)
        {
            try
            {
                var subscription = await _context.Subscriptions
                    .Include(s => s.User)
                    .Include(s => s.Product)
                    .FirstOrDefaultAsync(s => s.Id == subscriptionId);

                if (subscription == null)
                {
                    errors.Add($"Subscription {subscriptionId} không tồn tại");
                    failedCount++;
                    continue;
                }

                if (subscription.Status != SubStatus.active)
                {
                    errors.Add($"Subscription {subscriptionId} không ở trạng thái active");
                    failedCount++;
                    continue;
                }

                // Create or get existing confirmation token
                var existingConfirmation = await _context.SubscriptionConfirmations
                    .FirstOrDefaultAsync(sc => 
                        sc.SubscriptionId == subscriptionId && 
                        sc.ScheduledDeliveryDate == subscription.NextDeliveryDate &&
                        sc.ExpiresAt > DateTime.UtcNow);

                string token;
                if (existingConfirmation != null)
                {
                    token = existingConfirmation.Token;
                }
                else
                {
                    token = Guid.NewGuid().ToString("N");
                    var confirmation = new SubscriptionConfirmation
                    {
                        Id = Guid.NewGuid(),
                        SubscriptionId = subscriptionId,
                        Token = token,
                        ScheduledDeliveryDate = subscription.NextDeliveryDate,
                        ExpiresAt = DateTime.UtcNow.AddDays(7),
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.SubscriptionConfirmations.Add(confirmation);
                    await _context.SaveChangesAsync();
                }

                // Send email directly using IEmailService
                if (subscription.User != null && subscription.Product != null)
                {
                    await _emailService.SendSubscriptionReminderAsync(
                        subscription.User.Email,
                        subscription.User.FullName ?? "Khách hàng",
                        subscription.Product.Name,
                        subscription.NextDeliveryDate,
                        token
                    );

                    successCount++;
                    _logger.LogInformation("Sent manual reminder for subscription {SubscriptionId} to {Email}", 
                        subscriptionId, subscription.User.Email);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending manual reminder for subscription {SubscriptionId}", subscriptionId);
                errors.Add($"Lỗi gửi email cho subscription {subscriptionId}: {ex.Message}");
                failedCount++;
            }
        }

        response.Success = successCount > 0;
        response.SuccessCount = successCount;
        response.FailedCount = failedCount;
        response.Errors = errors;
        response.Message = $"Đã gửi {successCount} email thành công, {failedCount} thất bại";

        return response;
    }
}
