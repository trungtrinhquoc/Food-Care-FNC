using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Stock reservation for orders
/// </summary>
[Table("stock_reservations")]
[Index("InventoryId", Name = "ix_stock_reservations_inventory_id")]
[Index("OrderId", Name = "ix_stock_reservations_order_id")]
[Index("Status", Name = "ix_stock_reservations_status")]
[Index("ExpiresAt", Name = "ix_stock_reservations_expires_at")]
public class StockReservation
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("inventory_id")]
    public Guid InventoryId { get; set; }

    [Column("order_id")]
    public Guid? OrderId { get; set; }

    [Column("order_item_id")]
    public Guid? OrderItemId { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; }

    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "active"; // active, fulfilled, cancelled, expired

    [Column("reserved_at")]
    public DateTime ReservedAt { get; set; } = DateTime.UtcNow;

    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    [Column("fulfilled_at")]
    public DateTime? FulfilledAt { get; set; }

    [Column("cancelled_at")]
    public DateTime? CancelledAt { get; set; }

    [Column("reserved_by")]
    public Guid? ReservedBy { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation properties
    [ForeignKey("InventoryId")]
    public virtual WarehouseInventory Inventory { get; set; } = null!;

    [ForeignKey("OrderId")]
    public virtual Order? Order { get; set; }

    [ForeignKey("ReservedBy")]
    public virtual User? ReservedByUser { get; set; }
}
