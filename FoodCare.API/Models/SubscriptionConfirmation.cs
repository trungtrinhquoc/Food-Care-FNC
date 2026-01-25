using System;

namespace FoodCare.API.Models;

public partial class SubscriptionConfirmation
{
    public Guid Id { get; set; }

    public Guid SubscriptionId { get; set; }

    public string Token { get; set; } = null!;

    public DateOnly ScheduledDeliveryDate { get; set; }

    public bool IsConfirmed { get; set; } = false;

    public string? CustomerResponse { get; set; }

    public DateTime? RespondedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    // Navigation properties
    public virtual Subscription? Subscription { get; set; }
}
