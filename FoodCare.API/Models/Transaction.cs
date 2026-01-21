namespace FoodCare.API.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FoodCare.API.Models.Enums;

[Table("transactions")]
public class Transaction
{
    // ===== Primary Key =====
    [Key]
    public Guid Id { get; set; }

    // ===== Foreign Keys =====
    public Guid OrderId { get; set; }                // dùng cho order hiện tại
    public Guid? SubscriptionId { get; set; }        // để mở rộng sau
    public Guid UserId { get; set; }

    // ===== Payment Info =====
    [Required]
    [MaxLength(50)]
    public string Provider { get; set; } = default!; // payos, vnpay...

    [Required]
    public TransactionType TransactionType { get; set; }

    [Required]
    [Column(TypeName = "decimal(15,2)")]
    public decimal Amount { get; set; }

    [MaxLength(10)]
    public string Currency { get; set; } = "VND";

    // ===== Status & Retry =====
    [Required]
    public TransactionStatus Status { get; set; }

    public int AttemptNumber { get; set; } = 1;

    // ===== Gateway Data =====
    [MaxLength(100)]
    public string? ProviderTransactionId { get; set; }

    [Column(TypeName = "jsonb")]
    public string? ProviderResponse { get; set; }

    // ===== Time =====
    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ===== Navigation =====
    public Order Order { get; set; } = default!;
    public Subscription? Subscription { get; set; }
    public User User { get; set; } = default!;
}


