using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models;

[Table("wallet_transactions")]
public class WalletTransaction
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    [Required]
    [Column(TypeName = "decimal(15,2)")]
    public decimal Amount { get; set; }

    [Required]
    public WalletTransactionType Type { get; set; }

    public WalletTransactionStatus Status { get; set; } = WalletTransactionStatus.Pending;

    // Reference tới order hoặc subscription liên quan
    public Guid? ReferenceId { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual User User { get; set; } = null!;
}
