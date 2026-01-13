using System;
using System.Collections.Generic;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models;

public partial class Order
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public decimal Subtotal { get; set; }

    public decimal? ShippingFee { get; set; }

    public decimal? DiscountAmount { get; set; }

    public decimal TotalAmount { get; set; }

    public string ShippingAddressSnapshot { get; set; } = null!;

    public string? PaymentMethodSnapshot { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.pending;

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.unpaid;

    public DateTime? PaidAt { get; set; }

    public bool? IsSubscriptionOrder { get; set; }

    public Guid? SubscriptionId { get; set; }

    public string? Note { get; set; }

    public string? TrackingNumber { get; set; }

    public string? ShippingProvider { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<OrderStatusHistory> OrderStatusHistories { get; set; } = new List<OrderStatusHistory>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual Subscription? Subscription { get; set; }

    public virtual ICollection<SubscriptionSchedule> SubscriptionSchedules { get; set; } = new List<SubscriptionSchedule>();

    public virtual User? User { get; set; }

    public virtual ICollection<ZaloMessagesLog> ZaloMessagesLogs { get; set; } = new List<ZaloMessagesLog>();
}
