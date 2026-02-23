using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Return shipment back to supplier
/// </summary>
[Table("return_shipments")]
[Index("OriginalShipmentId", Name = "ix_return_shipments_original_shipment_id")]
[Index("SupplierId", Name = "ix_return_shipments_supplier_id")]
[Index("Status", Name = "ix_return_shipments_status")]
[Index("ReturnNumber", Name = "ix_return_shipments_number", IsUnique = true)]
public class ReturnShipment
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("return_number")]
    public string ReturnNumber { get; set; } = null!;

    [Column("original_shipment_id")]
    public Guid OriginalShipmentId { get; set; }

    [Column("discrepancy_report_id")]
    public Guid? DiscrepancyReportId { get; set; }

    [Column("supplier_id")]
    public int SupplierId { get; set; }

    [Column("warehouse_id")]
    public Guid WarehouseId { get; set; }

    [StringLength(50)]
    [Column("status")]
    public string Status { get; set; } = "pending"; // pending, approved, shipped, received, completed, cancelled

    [StringLength(50)]
    [Column("return_reason")]
    public string ReturnReason { get; set; } = null!; // damaged, quality, wrong_item, expired, etc.

    [Column("description")]
    public string? Description { get; set; }

    [Column("total_items")]
    public int TotalItems { get; set; }

    [Column("total_quantity")]
    public int TotalQuantity { get; set; }

    [Precision(15, 2)]
    [Column("total_value")]
    public decimal? TotalValue { get; set; }

    [StringLength(255)]
    [Column("tracking_number")]
    public string? TrackingNumber { get; set; }

    [StringLength(100)]
    [Column("carrier")]
    public string? Carrier { get; set; }

    [Column("shipped_at")]
    public DateTime? ShippedAt { get; set; }

    [Column("supplier_received_at")]
    public DateTime? SupplierReceivedAt { get; set; }

    [StringLength(50)]
    [Column("credit_status")]
    public string? CreditStatus { get; set; } // pending, issued, rejected

    [Precision(15, 2)]
    [Column("credit_amount")]
    public decimal? CreditAmount { get; set; }

    [Column("credit_issued_at")]
    public DateTime? CreditIssuedAt { get; set; }

    [Column("created_by")]
    public Guid CreatedBy { get; set; }

    [Column("approved_by")]
    public Guid? ApprovedBy { get; set; }

    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("OriginalShipmentId")]
    public virtual SupplierShipment OriginalShipment { get; set; } = null!;

    [ForeignKey("DiscrepancyReportId")]
    public virtual DiscrepancyReport? DiscrepancyReport { get; set; }

    [ForeignKey("SupplierId")]
    public virtual Supplier Supplier { get; set; } = null!;

    [ForeignKey("WarehouseId")]
    public virtual Warehouse Warehouse { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    public virtual User Creator { get; set; } = null!;

    [ForeignKey("ApprovedBy")]
    public virtual User? Approver { get; set; }

    public virtual ICollection<ReturnItem> Items { get; set; } = new List<ReturnItem>();
}
