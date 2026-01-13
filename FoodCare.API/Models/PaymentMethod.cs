using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class PaymentMethod
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Provider { get; set; } = null!;

    public string ProviderToken { get; set; } = null!;

    public string? Last4Digits { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    public bool? IsDefault { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();

    public virtual User User { get; set; } = null!;
}
