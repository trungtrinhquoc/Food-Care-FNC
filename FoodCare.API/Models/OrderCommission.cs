using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models;

/// <summary>
/// Immutable per-order commission ledger entry.
/// Created when an order transitions to <see cref="Enums.OrderStatus.delivered"/>.
/// <para>
/// <c>CommissionAmount</c> is retained by the platform (Admin).
/// <c>SupplierAmount</c> is credited to the supplier.
/// </para>
/// </summary>
[Table("order_commissions")]
[Index("OrderId",    Name = "uq_order_commission_order",       IsUnique = true)]
[Index("SupplierId", Name = "idx_order_commissions_supplier")]
[Index("Status",     Name = "idx_order_commissions_status")]
[Index("CreatedAt",  Name = "idx_order_commissions_created",   AllDescending = true)]
public class OrderCommission
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("order_id")]
    public Guid OrderId { get; set; }

    [Column("supplier_id")]
    public int SupplierId { get; set; }

    [Column("policy_id")]
    public int? PolicyId { get; set; }

    /// <summary>Gross order value on which commission is calculated.</summary>
    [Precision(15, 2)]
    [Column("order_amount")]
    public decimal OrderAmount { get; set; }

    /// <summary>Rate snapshot at the time the commission was recorded, e.g. 15.00.</summary>
    [Precision(5, 2)]
    [Column("commission_rate")]
    public decimal CommissionRate { get; set; }

    /// <summary>Amount retained by platform = OrderAmount * CommissionRate / 100.</summary>
    [Precision(15, 2)]
    [Column("commission_amount")]
    public decimal CommissionAmount { get; set; }

    /// <summary>Amount credited to supplier = OrderAmount - CommissionAmount.</summary>
    [Precision(15, 2)]
    [Column("supplier_amount")]
    public decimal SupplierAmount { get; set; }

    /// <summary>Set when this record is included in a monthly settlement run.</summary>
    [Column("settlement_id")]
    public Guid? SettlementId { get; set; }

    /// <summary>pending | settled | refunded</summary>
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "pending";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(OrderId))]
    public virtual Order Order { get; set; } = null!;

    [ForeignKey(nameof(SupplierId))]
    public virtual Supplier Supplier { get; set; } = null!;

    [ForeignKey(nameof(PolicyId))]
    public virtual CommissionPolicy? Policy { get; set; }

    [ForeignKey(nameof(SettlementId))]
    public virtual Settlement? Settlement { get; set; }
}
