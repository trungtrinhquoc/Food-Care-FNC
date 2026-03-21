using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using FoodCare.API.Models;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Jobs;

/// <summary>
/// Background job: tự động giám sát SLA và chất lượng mart.
/// Chạy mỗi 6 giờ, kiểm tra các ngưỡng SLA/Quality và tạo SupplierAlert khi phát hiện vi phạm.
/// </summary>
public class SlaMonitoringJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SlaMonitoringJob> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromHours(6);

    // Thresholds for SLA/Quality monitoring
    private const decimal SlaThreshold = 95m;
    private const decimal RatingThreshold = 3.5m;
    private const decimal QualityScoreThreshold = 50m;
    private const decimal ReturnRateThreshold = 20m;

    public SlaMonitoringJob(IServiceProvider serviceProvider, ILogger<SlaMonitoringJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[SlaMonitoringJob] Started. Interval: {Interval}", _interval);

        try { await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await MonitorSuppliersAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SlaMonitoringJob] Unhandled error in job loop");
            }

            try
            {
                await Task.Delay(_interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("[SlaMonitoringJob] Stopped.");
    }

    private async Task MonitorSuppliersAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FoodCareDbContext>();

        var suppliers = await db.Suppliers
            .Where(s => s.IsActive == true && s.IsDeleted != true)
            .ToListAsync(ct);

        if (suppliers.Count == 0)
        {
            _logger.LogDebug("[SlaMonitoringJob] No active suppliers found");
            return;
        }

        _logger.LogInformation("[SlaMonitoringJob] Checking {Count} active suppliers", suppliers.Count);

        var cutoff = DateTime.UtcNow.AddHours(-24);
        var recentAlerts = await db.SupplierAlerts
            .Where(a => a.CreatedAt > cutoff)
            .Select(a => new { a.SupplierId, a.Type })
            .ToListAsync(ct);

        var recentAlertSet = new HashSet<string>(
            recentAlerts.Select(a => $"{a.SupplierId}:{a.Type}"));

        int alertsCreated = 0;

        foreach (var supplier in suppliers)
        {
            if (ct.IsCancellationRequested) break;

            var alerts = DetectBreaches(supplier, recentAlertSet);

            foreach (var alert in alerts)
            {
                db.SupplierAlerts.Add(alert);
                alertsCreated++;
            }
        }

        if (alertsCreated > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("[SlaMonitoringJob] Created {Count} alerts", alertsCreated);
        }
        else
        {
            _logger.LogDebug("[SlaMonitoringJob] No SLA/Quality breaches detected");
        }
    }

    private List<SupplierAlert> DetectBreaches(Supplier supplier, HashSet<string> recentAlertSet)
    {
        var alerts = new List<SupplierAlert>();
        var now = DateTime.UtcNow;

        // Check SLA compliance rate
        var slaRate = supplier.SlaComplianceRate ?? 100m;
        if (slaRate < SlaThreshold && (supplier.TotalOrders ?? 0) >= 5)
        {
            var key = $"{supplier.Id}:sla_breach";
            if (!recentAlertSet.Contains(key))
            {
                alerts.Add(CreateAlert(supplier.Id, "sla_breach",
                    $"SLA thấp: {supplier.StoreName}",
                    $"Tỷ lệ SLA của {supplier.StoreName} đã giảm xuống {slaRate:F1}% (ngưỡng: {SlaThreshold}%).",
                    slaRate < 80m ? "critical" : "warning",
                    new { slaRate, threshold = SlaThreshold, totalOrders = supplier.TotalOrders, completedOrders = supplier.CompletedOrders },
                    now));
            }
        }

        // Check rating
        var rating = supplier.Rating ?? 5m;
        if (rating < RatingThreshold && (supplier.TotalOrders ?? 0) >= 5)
        {
            var key = $"{supplier.Id}:low_rating";
            if (!recentAlertSet.Contains(key))
            {
                alerts.Add(CreateAlert(supplier.Id, "low_rating",
                    $"Đánh giá thấp: {supplier.StoreName}",
                    $"Đánh giá trung bình của {supplier.StoreName} là {rating:F1}/5.0 (ngưỡng: {RatingThreshold}).",
                    rating < 2.5m ? "critical" : "warning",
                    new { rating, threshold = RatingThreshold },
                    now));
            }
        }

        // Check quality score
        var qualityScore = supplier.QualityScore ?? 100m;
        if (qualityScore < QualityScoreThreshold && (supplier.TotalOrders ?? 0) >= 5)
        {
            var key = $"{supplier.Id}:quality_warning";
            if (!recentAlertSet.Contains(key))
            {
                alerts.Add(CreateAlert(supplier.Id, "quality_warning",
                    $"Chất lượng thấp: {supplier.StoreName}",
                    $"Điểm chất lượng của {supplier.StoreName} là {qualityScore:F1}/100 (ngưỡng: {QualityScoreThreshold}).",
                    qualityScore < 30m ? "critical" : "warning",
                    new { qualityScore, threshold = QualityScoreThreshold, issueCount = supplier.IssueCount },
                    now));
            }
        }

        // Check return rate
        var returnRate = supplier.ReturnRate ?? 0m;
        if (returnRate > ReturnRateThreshold && (supplier.TotalOrders ?? 0) >= 5)
        {
            var key = $"{supplier.Id}:high_return_rate";
            if (!recentAlertSet.Contains(key))
            {
                alerts.Add(CreateAlert(supplier.Id, "high_return_rate",
                    $"Tỷ lệ trả hàng cao: {supplier.StoreName}",
                    $"Tỷ lệ trả hàng của {supplier.StoreName} là {returnRate:F1}% (ngưỡng: {ReturnRateThreshold}%).",
                    returnRate > 35m ? "critical" : "warning",
                    new { returnRate, threshold = ReturnRateThreshold, returnedOrders = supplier.ReturnedOrders },
                    now));
            }
        }

        return alerts;
    }

    private static SupplierAlert CreateAlert(int supplierId, string type, string title, string message, string severity, object data, DateTime now)
    {
        return new SupplierAlert
        {
            Id = Guid.NewGuid(),
            SupplierId = supplierId,
            Type = type,
            Title = title,
            Message = message,
            Severity = severity,
            IsRead = false,
            CreatedAt = now,
            Data = JsonSerializer.Serialize(data)
        };
    }
}
