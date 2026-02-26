using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Discrepancy report for shipment/receipt issues
/// </summary>
[Table("discrepancy_reports")]
[Index("ShipmentId", Name = "ix_discrepancy_reports_shipment_id")]
[Index("ReceiptId", Name = "ix_discrepancy_reports_receipt_id")]
[Index("SupplierId", Name = "ix_discrepancy_reports_supplier_id")]
[Index("Status", Name = "ix_discrepancy_reports_status")]
[Index("ReportNumber", Name = "ix_discrepancy_reports_number", IsUnique = true)]
public class DiscrepancyReport
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("report_number")]
    public string ReportNumber { get; set; } = null!;

    [Column("shipment_id")]
    public Guid ShipmentId { get; set; }

    [Column("receipt_id")]
    public Guid? ReceiptId { get; set; }

    [Column("supplier_id")]
    public int SupplierId { get; set; }

    [Column("discrepancy_type")]
    public DiscrepancyType DiscrepancyType { get; set; }

    [StringLength(50)]
    [Column("status")]
    public string Status { get; set; } = "open"; // open, investigating, resolved, closed

    [Column("description")]
    public string Description { get; set; } = null!;

    [Column("affected_quantity")]
    public int AffectedQuantity { get; set; }

    [Precision(15, 2)]
    [Column("affected_value")]
    public decimal? AffectedValue { get; set; }

    [Column("supplier_notified_at")]
    public DateTime? SupplierNotifiedAt { get; set; }

    [Column("supplier_response")]
    public string? SupplierResponse { get; set; }

    [Column("supplier_response_at")]
    public DateTime? SupplierResponseAt { get; set; }

    [StringLength(50)]
    [Column("resolution_type")]
    public string? ResolutionType { get; set; } // credit, replacement, return, accept_as_is

    [Column("resolution_notes")]
    public string? ResolutionNotes { get; set; }

    [Column("resolved_at")]
    public DateTime? ResolvedAt { get; set; }

    [Column("resolved_by")]
    public Guid? ResolvedBy { get; set; }

    [Column("reported_by")]
    public Guid ReportedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("ShipmentId")]
    public virtual SupplierShipment Shipment { get; set; } = null!;

    [ForeignKey("ReceiptId")]
    public virtual Receipt? Receipt { get; set; }

    [ForeignKey("SupplierId")]
    public virtual Supplier Supplier { get; set; } = null!;

    [ForeignKey("ReportedBy")]
    public virtual StaffMember ReportedByStaff { get; set; } = null!;

    [ForeignKey("ResolvedBy")]
    public virtual User? ResolvedByUser { get; set; }

    // Note: ResolvedByStaff can be retrieved via ResolvedByUser.StaffMember if needed
    // For now we use ResolvedByUser directly

    public virtual ICollection<DiscrepancyItem> Items { get; set; } = new List<DiscrepancyItem>();
}
