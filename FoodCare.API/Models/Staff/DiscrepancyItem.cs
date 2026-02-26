using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Individual item in a discrepancy report
/// </summary>
[Table("discrepancy_items")]
[Index("DiscrepancyReportId", Name = "ix_discrepancy_items_report_id")]
[Index("ProductId", Name = "ix_discrepancy_items_product_id")]
public class DiscrepancyItem
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("discrepancy_report_id")]
    public Guid DiscrepancyReportId { get; set; }

    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Column("shipment_item_id")]
    public Guid? ShipmentItemId { get; set; }

    [Column("discrepancy_type")]
    public DiscrepancyType DiscrepancyType { get; set; }

    [Column("expected_quantity")]
    public int ExpectedQuantity { get; set; }

    [Column("actual_quantity")]
    public int ActualQuantity { get; set; }

    [Column("discrepancy_quantity")]
    public int DiscrepancyQuantity { get; set; }

    [StringLength(100)]
    [Column("batch_number")]
    public string? BatchNumber { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("evidence_urls")]
    public string? EvidenceUrls { get; set; } // JSON array of image URLs

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("DiscrepancyReportId")]
    public virtual DiscrepancyReport DiscrepancyReport { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;

    [ForeignKey("ShipmentItemId")]
    public virtual ShipmentItem? ShipmentItem { get; set; }
}
