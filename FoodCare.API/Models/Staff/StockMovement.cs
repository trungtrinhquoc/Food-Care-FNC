using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Stock movement record for audit trail and FIFO tracking
/// </summary>
[Table("stock_movements")]
[Index("InventoryId", Name = "ix_stock_movements_inventory_id")]
[Index("WarehouseId", Name = "ix_stock_movements_warehouse_id")]
[Index("ProductId", Name = "ix_stock_movements_product_id")]
[Index("MovementType", Name = "ix_stock_movements_type")]
[Index("ReferenceType", "ReferenceId", Name = "ix_stock_movements_reference")]
[Index("CreatedAt", Name = "ix_stock_movements_created_at")]
public class StockMovement
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("inventory_id")]
    public Guid InventoryId { get; set; }

    [Column("warehouse_id")]
    public Guid WarehouseId { get; set; }

    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Column("movement_type")]
    public MovementType MovementType { get; set; }

    [Column("quantity_change")]
    public int QuantityChange { get; set; } // Positive for in, negative for out

    [Column("quantity_before")]
    public int QuantityBefore { get; set; }

    [Column("quantity_after")]
    public int QuantityAfter { get; set; }

    [StringLength(100)]
    [Column("batch_number")]
    public string? BatchNumber { get; set; }

    [StringLength(50)]
    [Column("reference_type")]
    public string? ReferenceType { get; set; } // receipt, order, adjustment, return

    [Column("reference_id")]
    public Guid? ReferenceId { get; set; }

    [Precision(15, 2)]
    [Column("unit_cost")]
    public decimal? UnitCost { get; set; }

    [Precision(15, 2)]
    [Column("total_cost")]
    public decimal? TotalCost { get; set; }

    [StringLength(255)]
    [Column("reason")]
    public string? Reason { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("performed_by")]
    public Guid PerformedBy { get; set; }

    [Column("approved_by")]
    public Guid? ApprovedBy { get; set; }

    [Column("is_fifo_override")]
    public bool IsFifoOverride { get; set; } = false;

    [Column("override_reason")]
    public string? OverrideReason { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("InventoryId")]
    public virtual WarehouseInventory Inventory { get; set; } = null!;

    [ForeignKey("WarehouseId")]
    public virtual Warehouse Warehouse { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;

    [ForeignKey("PerformedBy")]
    public virtual StaffMember PerformedByStaff { get; set; } = null!;

    [ForeignKey("ApprovedBy")]
    public virtual StaffMember? ApprovedByStaff { get; set; }
}
