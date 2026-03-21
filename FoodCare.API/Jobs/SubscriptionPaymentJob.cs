using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using FoodCare.API.Models;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Jobs;

/// <summary>
/// Background job: tự động xử lý đơn hàng subscription đến hạn giao.
/// Chạy mỗi giờ, kiểm tra subscription nào cần tạo đơn hàng và thanh toán bằng FNC Pay.
/// </summary>
public class SubscriptionPaymentJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SubscriptionPaymentJob> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromHours(1);

    public SubscriptionPaymentJob(IServiceProvider serviceProvider, ILogger<SubscriptionPaymentJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[SubscriptionPaymentJob] Started. Interval: {Interval}", _interval);

        // Chờ 10 giây để app khởi động xong trước khi bắt đầu job
        try { await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDueSubscriptionsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // App đang shutdown → thoát bình thường, không log error
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SubscriptionPaymentJob] Unhandled error in job loop");
            }

            try
            {
                await Task.Delay(_interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // App đang shutdown → thoát bình thường
                break;
            }
        }

        _logger.LogInformation("[SubscriptionPaymentJob] Stopped.");
    }

    private async Task ProcessDueSubscriptionsAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FoodCareDbContext>();
        var walletService = scope.ServiceProvider.GetRequiredService<IWalletService>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Lấy tất cả subscriptions active mà đã tới hạn giao
        var dueSubscriptions = await db.Subscriptions
            .Include(s => s.Product)
            .Where(s => s.Status == SubStatus.active && s.NextDeliveryDate <= today)
            .ToListAsync(ct);

        if (dueSubscriptions.Count == 0)
        {
            _logger.LogDebug("[SubscriptionPaymentJob] No due subscriptions found");
            return;
        }

        _logger.LogInformation("[SubscriptionPaymentJob] Found {Count} due subscriptions", dueSubscriptions.Count);

        foreach (var sub in dueSubscriptions)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                await ProcessSingleSubscriptionAsync(db, walletService, sub);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SubscriptionPaymentJob] Failed to process subscription {SubscriptionId}", sub.Id);
            }
        }
    }

    private async Task ProcessSingleSubscriptionAsync(FoodCareDbContext db, IWalletService walletService, Subscription sub)
    {
        if (sub.UserId == null || sub.Product == null)
        {
            _logger.LogWarning("[SubscriptionPaymentJob] Subscription {Id} missing UserId or Product, skipping", sub.Id);
            return;
        }

        var quantity = sub.Quantity ?? 1;
        var unitPrice = sub.Product.BasePrice;
        var discount = sub.DiscountPercent ?? 0;
        var subtotal = unitPrice * quantity;
        var discountAmount = subtotal * (discount / 100);
        var totalAmount = Math.Max(0, subtotal - discountAmount);

        _logger.LogInformation(
            "[SubscriptionPaymentJob] Processing subscription {SubscriptionId} - Product: {Product}, Amount: {Amount}",
            sub.Id, sub.Product.Name, totalAmount);

        // Tạo order trong transaction
        using var dbTransaction = await db.Database.BeginTransactionAsync();
        try
        {
            // 1. Tạo Order cho subscription
            var order = new Order
            {
                Id = Guid.NewGuid(),
                UserId = sub.UserId,
                Subtotal = subtotal,
                ShippingFee = 0,
                DiscountAmount = discountAmount,
                TotalAmount = totalAmount,
                ShippingAddressSnapshot = JsonSerializer.Serialize(new { source = "subscription", subscriptionId = sub.Id }),
                PaymentMethodSnapshot = JsonSerializer.Serialize(new { method = "wallet" }),
                Status = OrderStatus.pending,
                PaymentStatus = PaymentStatus.unpaid,
                IsSubscriptionOrder = true,
                SubscriptionId = sub.Id,
                Note = $"Đơn hàng tự động từ gói đăng ký #{sub.Id.ToString()[..8].ToUpper()}",
                CreatedAt = DateTime.UtcNow
            };

            db.Orders.Add(order);

            // 2. Tạo OrderItem
            var orderItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = sub.ProductId,
                ProductName = sub.Product.Name,
                Quantity = quantity,
                Price = unitPrice,
                TotalPrice = subtotal,
                CreatedAt = DateTime.UtcNow
            };

            db.OrderItems.Add(orderItem);

            // 3. Tạo PaymentLog
            var paymentLog = new PaymentLog
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                UserId = sub.UserId.Value,
                Amount = totalAmount,
                PaymentMethod = "wallet",
                PaymentMethodName = "FNC Pay",
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };
            db.PaymentLogs.Add(paymentLog);

            await db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            _logger.LogInformation("[SubscriptionPaymentJob] Order {OrderId} created for subscription {SubscriptionId}",
                order.Id, sub.Id);

            // 4. Thanh toán bằng ví (atomic - trong WalletService)
            try
            {
                await walletService.PayOrderWithWalletAsync(sub.UserId.Value, order.Id);

                // 5. Cập nhật NextDeliveryDate (thanh toán thành công)
                sub.NextDeliveryDate = CalculateNextDeliveryDate(sub.Frequency, sub.NextDeliveryDate);
                sub.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();

                // 6. Tạo notification thành công
                var successNotif = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = sub.UserId.Value,
                    Title = "✅ Đơn hàng đăng ký đã thanh toán!",
                    Message = $"Đơn hàng tự động cho sản phẩm \"{sub.Product.Name}\" đã được thanh toán thành công bằng FNC Pay ({totalAmount:N0} VNĐ).",
                    Type = "subscription_payment_success",
                    IsRead = false,
                    LinkUrl = $"/profile?tab=orders&orderId={order.Id}",
                    CreatedAt = DateTime.UtcNow
                };
                db.Notifications.Add(successNotif);
                await db.SaveChangesAsync();

                _logger.LogInformation("[SubscriptionPaymentJob] ✅ Subscription {SubscriptionId} paid successfully", sub.Id);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("Số dư không đủ"))
            {
                // Số dư không đủ → cập nhật order status
                order.PaymentStatus = PaymentStatus.payment_failed;
                order.Status = OrderStatus.cancelled;

                paymentLog.Status = "failed";

                // Tạo notification thất bại
                var failNotif = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = sub.UserId.Value,
                    Title = "❌ Thanh toán đăng ký thất bại!",
                    Message = $"Không thể thanh toán đơn hàng cho sản phẩm \"{sub.Product.Name}\" ({totalAmount:N0} VNĐ). Lý do: {ex.Message}. Vui lòng nạp thêm tiền vào FNC Pay.",
                    Type = "subscription_payment_failed",
                    IsRead = false,
                    LinkUrl = "/profile?tab=wallet",
                    CreatedAt = DateTime.UtcNow
                };
                db.Notifications.Add(failNotif);
                await db.SaveChangesAsync();

                _logger.LogWarning("[SubscriptionPaymentJob] ❌ Insufficient balance for subscription {SubscriptionId}: {Error}",
                    sub.Id, ex.Message);
            }
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            _logger.LogError(ex, "[SubscriptionPaymentJob] Failed to create order for subscription {SubscriptionId}", sub.Id);
            throw;
        }
    }

    private static DateOnly CalculateNextDeliveryDate(SubFrequency frequency, DateOnly currentDate)
    {
        return frequency switch
        {
            SubFrequency.weekly => currentDate.AddDays(7),
            SubFrequency.biweekly => currentDate.AddDays(14),
            SubFrequency.monthly => currentDate.AddMonths(1),
            _ => currentDate.AddMonths(1)
        };
    }
}
