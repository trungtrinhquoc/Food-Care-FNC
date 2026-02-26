using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Individual item in a receipt with inspection results
/// </summary>
[Table("receipt_items")]
[Index("ReceiptId", Name = "ix_receipt_items_receipt_id")]
[Index("ShipmentItemId", Name = "ix_receipt_items_shipment_item_id")]
[Index("ProductId", Name = "ix_receipt_items_product_id")]
public class ReceiptItem
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("receipt_id")]
    public Guid ReceiptId { get; set; }

    [Column("shipment_item_id")]
    public Guid ShipmentItemId { get; set; }

    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Column("expected_quantity")]
    public int ExpectedQuantity { get; set; }

    [Column("received_quantity")]
    public int ReceivedQuantity { get; set; }

    [Column("accepted_quantity")]
    public int AcceptedQuantity { get; set; }

    [Column("damaged_quantity")]
    public int DamagedQuantity { get; set; }

    [Column("missing_quantity")]
    public int MissingQuantity { get; set; }

    [Column("quarantine_quantity")]
    public int QuarantineQuantity { get; set; }

    [StringLength(100)]
    [Column("batch_number")]
    public string? BatchNumber { get; set; }

    [Column("expiry_date")]
    public DateTime? ExpiryDate { get; set; }

    [Column("status")]
    public ReceiptStatus Status { get; set; } = ReceiptStatus.Pending;

    // QC fields
    [Column("qc_required")]
    public bool QcRequired { get; set; } = false;

    [Column("qc_passed")]
    public bool? QcPassed { get; set; }

    [Column("qc_sample_size")]
    public int? QcSampleSize { get; set; }

    [Column("qc_passed_count")]
    public int? QcPassedCount { get; set; }

    [Column("qc_notes")]
    public string? QcNotes { get; set; }

    [Column("inspection_notes")]
    public string? InspectionNotes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("ReceiptId")]
    public virtual Receipt Receipt { get; set; } = null!;

    [ForeignKey("ShipmentItemId")]
    public virtual ShipmentItem ShipmentItem { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;
}
