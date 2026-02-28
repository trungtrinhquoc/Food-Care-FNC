using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Warehouse inventory with batch and expiry tracking
/// </summary>
[Table("warehouse_inventory")]
[Index("WarehouseId", Name = "ix_warehouse_inventory_warehouse_id")]
[Index("ProductId", Name = "ix_warehouse_inventory_product_id")]
[Index("BatchNumber", Name = "ix_warehouse_inventory_batch_number")]
[Index("ExpiryDate", Name = "ix_warehouse_inventory_expiry_date")]
[Index("InventoryType", Name = "ix_warehouse_inventory_type")]
[Index("WarehouseId", "ProductId", "BatchNumber", "InventoryType", Name = "ix_warehouse_inventory_unique", IsUnique = true)]
public class WarehouseInventory
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("warehouse_id")]
    public Guid WarehouseId { get; set; }

    [Column("product_id")]
    public Guid ProductId { get; set; }

    [StringLength(100)]
    [Column("batch_number")]
    public string? BatchNumber { get; set; }

    [Column("expiry_date")]
    public DateTime? ExpiryDate { get; set; }

    [Column("manufacture_date")]
    public DateTime? ManufactureDate { get; set; }

    [Column("inventory_type")]
    public InventoryType InventoryType { get; set; } = InventoryType.Available;

    [Column("quantity")]
    public int Quantity { get; set; } = 0;

    [Column("reserved_quantity")]
    public int ReservedQuantity { get; set; } = 0;

    [Column("available_quantity")]
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public int AvailableQuantity { get; set; }

    [Precision(15, 2)]
    [Column("unit_cost")]
    public decimal? UnitCost { get; set; }

    [StringLength(100)]
    [Column("location_code")]
    public string? LocationCode { get; set; } // Bin/shelf location

    [StringLength(100)]
    [Column("location")]
    public string? Location { get; set; } // General location info

    [Column("min_stock_level")]
    public int? MinStockLevel { get; set; }

    [Column("max_stock_level")]
    public int? MaxStockLevel { get; set; }

    [Column("supplier_id")]
    public int? SupplierId { get; set; }

    [Column("receipt_id")]
    public Guid? ReceiptId { get; set; }

    [Column("reorder_point")]
    public int? ReorderPoint { get; set; }

    [Column("reorder_quantity")]
    public int? ReorderQuantity { get; set; }

    [Column("last_counted_at")]
    public DateTime? LastCountedAt { get; set; }

    [Column("version")]
    [ConcurrencyCheck]
    public int Version { get; set; } = 1;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [Column("received_at")]
    public DateTime? ReceivedAt { get; set; }

    [Column("source_shipment_id")]
    public Guid? SourceShipmentId { get; set; }

    /// <summary>
    /// Alias for InventoryType for service compatibility
    /// </summary>
    [NotMapped]
    public InventoryType Type
    {
        get => InventoryType;
        set => InventoryType = value;
    }

    // Navigation properties
    [ForeignKey("WarehouseId")]
    public virtual Warehouse Warehouse { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;

    [ForeignKey("SupplierId")]
    public virtual Suppliers.Supplier? Supplier { get; set; }

    [ForeignKey("ReceiptId")]
    public virtual Receipt? Receipt { get; set; }

    public virtual ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public virtual ICollection<StockReservation> Reservations { get; set; } = new List<StockReservation>();
}
