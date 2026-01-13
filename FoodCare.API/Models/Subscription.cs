using System;
using System.Collections.Generic;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models;

public partial class Subscription
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public Guid? ProductId { get; set; }

    public SubFrequency Frequency { get; set; }

    public int? Quantity { get; set; }

    public decimal? DiscountPercent { get; set; }

    public SubStatus Status { get; set; } = SubStatus.active;

    public DateOnly? StartDate { get; set; }

    public DateOnly NextDeliveryDate { get; set; }

    public DateOnly? PauseUntil { get; set; }

    public Guid? PaymentMethodId { get; set; }

    public Guid? ShippingAddressId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual PaymentMethod? PaymentMethod { get; set; }

    public virtual Product? Product { get; set; }

    public virtual Address? ShippingAddress { get; set; }

    public virtual ICollection<SubscriptionSchedule> SubscriptionSchedules { get; set; } = new List<SubscriptionSchedule>();

    public virtual User? User { get; set; }
}
