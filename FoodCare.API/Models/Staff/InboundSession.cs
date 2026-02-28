using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Phiên nhập kho - groups multiple inbound receipts into one session.
/// Pattern: SAP/Odoo/Oracle goods receiving.
/// 1 Session → N Receipts (1 per supplier) → N Details per receipt.
/// </summary>
[Table("inbound_sessions")]
[Index("SessionCode", Name = "ix_inbound_sessions_code", IsUnique = true)]
[Index("WarehouseId", Name = "ix_inbound_sessions_warehouse_id")]
[Index("CreatedBy", Name = "ix_inbound_sessions_created_by")]
[Index("Status", Name = "ix_inbound_sessions_status")]
public class InboundSession
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>Auto-generated: IBS-yyyyMMdd-NNNN</summary>
    [Required]
    [StringLength(50)]
    [Column("session_code")]
    public string SessionCode { get; set; } = null!;

    [Column("warehouse_id")]
    public Guid WarehouseId { get; set; }

    /// <summary>Staff member who created the session</summary>
    [Column("created_by")]
    public Guid CreatedBy { get; set; }

    /// <summary>Staff member who approved/completed the session</summary>
    [Column("approved_by")]
    public Guid? ApprovedBy { get; set; }

    [Column("status")]
    public InboundSessionStatus Status { get; set; } = InboundSessionStatus.Draft;

    [StringLength(500)]
    [Column("note")]
    public string? Note { get; set; }

    [Column("total_suppliers")]
    public int TotalSuppliers { get; set; }

    [Column("total_items")]
    public int TotalItems { get; set; }

    [Column("total_quantity")]
    public int TotalQuantity { get; set; }

    [Column("total_amount")]
    public decimal TotalAmount { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("WarehouseId")]
    public virtual Warehouse Warehouse { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    public virtual StaffMember CreatedByStaff { get; set; } = null!;

    [ForeignKey("ApprovedBy")]
    public virtual StaffMember? ApprovedByStaff { get; set; }

    public virtual ICollection<InboundReceipt> Receipts { get; set; } = new List<InboundReceipt>();
}
