namespace FoodCare.API.Models.DTOs.Subscriptions;

public class SubscriptionConfirmationDto
{
    public Guid SubscriptionId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public DateOnly ScheduledDeliveryDate { get; set; }
    public string Frequency { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal TotalAmount { get; set; }
    public bool IsExpired { get; set; }
    public bool IsAlreadyProcessed { get; set; }
}

public class ProcessConfirmationRequest
{
    public string Token { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // "continue", "pause", "cancel"
    public DateOnly? PauseUntil { get; set; } // Required if action = "pause"
}

public class SubscriptionReminderStatsDto
{
    public int TotalActiveSubscriptions { get; set; }
    public int RemindersSentToday { get; set; }
    public int PendingConfirmations { get; set; }
    public int ConfirmedCount { get; set; }
    public int PausedCount { get; set; }
    public int CancelledCount { get; set; }
}
