using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models;

/// <summary>
/// Configurable commission rate policy.
/// A record with <c>SupplierId == null</c> represents the global platform default.
/// Supplier-specific records take priority over the global default.
/// </summary>
[Table("commission_policies")]
[Index("SupplierId", Name = "idx_commission_policies_supplier")]
[Index("IsActive", Name = "idx_commission_policies_active")]
public class CommissionPolicy
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    /// <summary>Null = global platform default; non-null = supplier-specific override.</summary>
    [Column("supplier_id")]
    public int? SupplierId { get; set; }

    [Column("category_id")]
    public int? CategoryId { get; set; }

    /// <summary>Commission percentage, e.g. 15.00 = 15%.</summary>
    [Precision(5, 2)]
    [Column("commission_rate")]
    public decimal CommissionRate { get; set; }

    [Column("effective_from")]
    public DateOnly EffectiveFrom { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    /// <summary>Null = active indefinitely.</summary>
    [Column("effective_to")]
    public DateOnly? EffectiveTo { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("created_by")]
    public Guid? CreatedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(SupplierId))]
    public virtual Supplier? Supplier { get; set; }
}
