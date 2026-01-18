using System;
using AutoMapper;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Subscriptions;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly FoodCareDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<SubscriptionService> _logger;

        public SubscriptionService(
            FoodCareDbContext context,
            IMapper mapper,
            ILogger<SubscriptionService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public  Task<List<SubscriptionOptionDto>> GetSubscriptionOptionsAsync()
        {
            return Task.FromResult(new List<SubscriptionOptionDto>
{
    new()
    {
        Frequency = SubFrequency.weekly,
        Label = "Hàng tuần",
        DiscountPercent = 15
    },
    new()
    {
        Frequency = SubFrequency.biweekly,
        Label = "2 tuần / lần",
        DiscountPercent = 12
    },
    new()
    {
        Frequency = SubFrequency.monthly,
        Label = "Hàng tháng",
        DiscountPercent = 10
    }
});
        }

        public async Task<SubscriptionDto> CreateSubscriptionAsync(CreateSubscriptionDto dto, Guid userId)
        {
            var subscription = new Subscription
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ProductId = dto.ProductId,
                Frequency = dto.Frequency,
                Quantity = dto.Quantity,
                DiscountPercent = dto.DiscountPercent,
                Status = Models.Enums.SubStatus.active,
                StartDate = dto.StartDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
                NextDeliveryDate = CalculateNextDelivery(dto.Frequency),
                PaymentMethodId = dto.PaymentMethodId,
                ShippingAddressId = dto.ShippingAddressId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            // Load Product để mapper lấy ProductName
            await _context.Entry(subscription)
                .Reference(s => s.Product)
                .LoadAsync();

            _logger.LogInformation("Subscription created: {SubscriptionId}", subscription.Id);

            return _mapper.Map<SubscriptionDto>(subscription);
        }

        public async Task<List<SubscriptionDto>> GetUserSubscriptionsAsync(Guid userId)
        {
            var subscriptions = await _context.Subscriptions
                .Include(s => s.Product)
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return _mapper.Map<List<SubscriptionDto>>(subscriptions);
        }

        public async Task<bool> PauseSubscriptionAsync(Guid subscriptionId, DateOnly? pauseUntil)
        {
            var subscription = await _context.Subscriptions.FindAsync(subscriptionId);
            if (subscription == null) return false;

            subscription.Status = Models.Enums.SubStatus.paused;
            subscription.PauseUntil = pauseUntil;
            subscription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResumeSubscriptionAsync(Guid subscriptionId)
        {
            var subscription = await _context.Subscriptions.FindAsync(subscriptionId);
            if (subscription == null) return false;

            subscription.Status = Models.Enums.SubStatus.active;
            subscription.PauseUntil = null;
            subscription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        private DateOnly CalculateNextDelivery(Models.Enums.SubFrequency frequency)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            return frequency switch
            {
                Models.Enums.SubFrequency.weekly => today.AddDays(7),
                Models.Enums.SubFrequency.biweekly => today.AddDays(14),
                Models.Enums.SubFrequency.monthly => today.AddMonths(1),
                _ => today.AddMonths(1)
            };
        }
    }
}