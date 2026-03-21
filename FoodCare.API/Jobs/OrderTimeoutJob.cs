using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using FoodCare.API.Models;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Jobs;

/// <summary>
/// Background job: tự động hủy đơn hàng chưa xác nhận sau 30 phút.
/// Nếu đơn đã thanh toán, hoàn tiền vào ví FNC Pay.
/// Spec 3.3 step 25.
/// </summary>
public class OrderTimeoutJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OrderTimeoutJob> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan _timeout = TimeSpan.FromMinutes(30);

    public OrderTimeoutJob(IServiceProvider serviceProvider, ILogger<OrderTimeoutJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[OrderTimeoutJob] Started. Interval: {Interval}, Timeout: {Timeout}", _interval, _timeout);

        // Initial delay to let the app start
        try { await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CancelTimedOutOrdersAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[OrderTimeoutJob] Unhandled error in job loop");
            }

            try { await Task.Delay(_interval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }

        _logger.LogInformation("[OrderTimeoutJob] Stopped.");
    }

    private async Task CancelTimedOutOrdersAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FoodCareDbContext>();
        var walletService = scope.ServiceProvider.GetRequiredService<IWalletService>();

        var cutoff = DateTime.UtcNow - _timeout;

        var timedOutOrders = await db.Orders
            .Where(o => o.Status == OrderStatus.pending
                     && o.CreatedAt < cutoff)
            .ToListAsync(ct);

        if (timedOutOrders.Count == 0) return;

        _logger.LogInformation("[OrderTimeoutJob] Found {Count} timed-out orders to cancel", timedOutOrders.Count);

        foreach (var order in timedOutOrders)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                var previousStatus = order.Status;
                order.Status = OrderStatus.cancelled;
                order.UpdatedAt = DateTime.UtcNow;

                // Log status history
                db.OrderStatusHistories.Add(new OrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    PreviousStatus = previousStatus,
                    NewStatus = OrderStatus.cancelled,
                    Note = "Tự động hủy: đơn hàng chưa được xác nhận sau 30 phút.",
                    CreatedAt = DateTime.UtcNow
                });

                // Refund if already paid
                if (order.PaymentStatus == PaymentStatus.paid && order.UserId.HasValue)
                {
                    await walletService.RefundAsync(
                        order.UserId.Value,
                        order.TotalAmount,
                        order.Id,
                        $"Hoàn tiền tự động - đơn #{order.Id.ToString()[..8]} hết hạn xác nhận");

                    _logger.LogInformation("[OrderTimeoutJob] Refunded {Amount} for order {OrderId}",
                        order.TotalAmount, order.Id);
                }

                _logger.LogInformation("[OrderTimeoutJob] Cancelled order {OrderId}", order.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[OrderTimeoutJob] Failed to cancel order {OrderId}", order.Id);
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
