using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Individual item in a supplier shipment
/// </summary>
[Table("shipment_items")]
[Index("ShipmentId", Name = "ix_shipment_items_shipment_id")]
[Index("ProductId", Name = "ix_shipment_items_product_id")]
[Index("BatchNumber", Name = "ix_shipment_items_batch_number")]
public class ShipmentItem
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("shipment_id")]
    public Guid ShipmentId { get; set; }

    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Column("expected_quantity")]
    public int ExpectedQuantity { get; set; }

    [StringLength(50)]
    [Column("uom")]
    public string Uom { get; set; } = "pcs";

    [StringLength(100)]
    [Column("batch_number")]
    public string? BatchNumber { get; set; }

    [Column("expiry_date")]
    public DateTime? ExpiryDate { get; set; }

    [Column("manufacture_date")]
    public DateTime? ManufactureDate { get; set; }

    [Precision(15, 2)]
    [Column("unit_cost")]
    public decimal? UnitCost { get; set; }

    [Precision(15, 2)]
    [Column("line_total")]
    public decimal? LineTotal { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("received_quantity")]
    public int? ReceivedQuantity { get; set; }

    [Column("damaged_quantity")]
    public int? DamagedQuantity { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("ShipmentId")]
    public virtual SupplierShipment Shipment { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;
}
