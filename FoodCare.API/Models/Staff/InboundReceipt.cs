using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Phiếu nhập theo nhà cung cấp - one receipt per supplier within a session.
/// Auto-grouped by SupplierId when staff adds items.
/// </summary>
[Table("inbound_receipts")]
[Index("SessionId", Name = "ix_inbound_receipts_session_id")]
[Index("SupplierId", Name = "ix_inbound_receipts_supplier_id")]
[Index("ReceiptCode", Name = "ix_inbound_receipts_code", IsUnique = true)]
[Index("Status", Name = "ix_inbound_receipts_status")]
public class InboundReceipt
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>Auto-generated: IBR-yyyyMMdd-NNNN</summary>
    [Required]
    [StringLength(50)]
    [Column("receipt_code")]
    public string ReceiptCode { get; set; } = null!;

    [Column("session_id")]
    public Guid SessionId { get; set; }

    /// <summary>Supplier FK (int PK in Supplier table)</summary>
    [Column("supplier_id")]
    public int SupplierId { get; set; }

    /// <summary>Denormalized for fast queries / display</summary>
    [StringLength(200)]
    [Column("supplier_name")]
    public string? SupplierName { get; set; }

    [Column("status")]
    public InboundReceiptStatus Status { get; set; } = InboundReceiptStatus.Pending;

    [Column("total_items")]
    public int TotalItems { get; set; }

    [Column("total_quantity")]
    public int TotalQuantity { get; set; }

    [Column("total_amount")]
    public decimal TotalAmount { get; set; }

    [StringLength(500)]
    [Column("note")]
    public string? Note { get; set; }

    [Column("confirmed_at")]
    public DateTime? ConfirmedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SessionId")]
    public virtual InboundSession Session { get; set; } = null!;

    [ForeignKey("SupplierId")]
    public virtual Supplier Supplier { get; set; } = null!;

    public virtual ICollection<InboundReceiptDetail> Details { get; set; } = new List<InboundReceiptDetail>();
}
