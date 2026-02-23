using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Individual item in a return shipment
/// </summary>
[Table("return_items")]
[Index("ReturnShipmentId", Name = "ix_return_items_return_shipment_id")]
[Index("ProductId", Name = "ix_return_items_product_id")]
public class ReturnItem
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("return_shipment_id")]
    public Guid ReturnShipmentId { get; set; }

    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Column("shipment_item_id")]
    public Guid? ShipmentItemId { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; }

    [StringLength(100)]
    [Column("batch_number")]
    public string? BatchNumber { get; set; }

    [StringLength(50)]
    [Column("return_reason")]
    public string ReturnReason { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    [Precision(15, 2)]
    [Column("unit_cost")]
    public decimal? UnitCost { get; set; }

    [Precision(15, 2)]
    [Column("line_total")]
    public decimal? LineTotal { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ReturnShipmentId")]
    public virtual ReturnShipment ReturnShipment { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;

    [ForeignKey("ShipmentItemId")]
    public virtual ShipmentItem? ShipmentItem { get; set; }
}
