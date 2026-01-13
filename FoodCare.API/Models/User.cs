using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using FoodCare.API.Models.Enums;
using System.Text.Json.Serialization;

namespace FoodCare.API.Models;

public partial class User
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string? FullName { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserRole Role { get; set; } = UserRole.customer;

    public string? PhoneNumber { get; set; }

    public string? AvatarUrl { get; set; }

    public int? TierId { get; set; }

    public int? LoyaltyPoints { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Address> Addresses { get; set; } = new List<Address>();

    public virtual ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();

    public virtual ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<OrderStatusHistory> OrderStatusHistories { get; set; } = new List<OrderStatusHistory>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<PaymentMethod> PaymentMethods { get; set; } = new List<PaymentMethod>();

    public virtual ICollection<ReviewHelpful> ReviewHelpfuls { get; set; } = new List<ReviewHelpful>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();

    public virtual MemberTier? Tier { get; set; }

    public virtual ICollection<ZaloMessagesLog> ZaloMessagesLogs { get; set; } = new List<ZaloMessagesLog>();
}
