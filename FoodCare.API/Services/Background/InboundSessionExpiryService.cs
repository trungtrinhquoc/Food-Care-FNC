using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using FoodCare.API.Models;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Services.Background;

/// <summary>
/// Background service that periodically checks for expired inbound sessions
/// and automatically cancels them when their ExpectedEndDate has passed.
/// Runs every 5 minutes.
/// </summary>
public class InboundSessionExpiryService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<InboundSessionExpiryService> _logger;
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(5);

    public InboundSessionExpiryService(
        IServiceScopeFactory scopeFactory,
        ILogger<InboundSessionExpiryService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("InboundSessionExpiryService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CloseExpiredSessionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking expired inbound sessions");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }

    private async Task CloseExpiredSessionsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<FoodCareDbContext>();

        var now = DateTime.UtcNow;

        // Find all non-terminal sessions whose ExpectedEndDate has passed
        var expiredSessions = await context.InboundSessions
            .Include(s => s.Receipts)
            .Where(s => s.ExpectedEndDate != null
                     && s.ExpectedEndDate <= now
                     && s.Status != InboundSessionStatus.Completed
                     && s.Status != InboundSessionStatus.Cancelled)
            .ToListAsync(ct);

        if (expiredSessions.Count == 0) return;

        _logger.LogInformation("Found {Count} expired inbound sessions to auto-close", expiredSessions.Count);

        foreach (var session in expiredSessions)
        {
            session.Status = InboundSessionStatus.Cancelled;
            session.Note = (session.Note ?? "") + "\n[Tự động] Phiên đã hết hạn và bị đóng tự động.";
            session.UpdatedAt = now;

            foreach (var receipt in session.Receipts)
            {
                if (receipt.Status != InboundReceiptStatus.Completed &&
                    receipt.Status != InboundReceiptStatus.Cancelled)
                {
                    receipt.Status = InboundReceiptStatus.Cancelled;
                    receipt.UpdatedAt = now;
                }
            }

            _logger.LogInformation("Auto-cancelled expired session {Code} (ExpectedEndDate: {EndDate})",
                session.SessionCode, session.ExpectedEndDate);
        }

        await context.SaveChangesAsync(ct);
    }
}
