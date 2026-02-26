using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Supplier shipment representing goods being sent from supplier to warehouse
/// </summary>
[Table("supplier_shipments")]
[Index("ExternalReference", Name = "ix_supplier_shipments_external_ref", IsUnique = true)]
[Index("SupplierId", Name = "ix_supplier_shipments_supplier_id")]
[Index("WarehouseId", Name = "ix_supplier_shipments_warehouse_id")]
[Index("Status", Name = "ix_supplier_shipments_status")]
[Index("ExpectedDeliveryDate", Name = "ix_supplier_shipments_expected_date")]
public class SupplierShipment
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [StringLength(100)]
    [Column("external_reference")]
    public string ExternalReference { get; set; } = null!;

    [Column("supplier_id")]
    public int SupplierId { get; set; }

    [Column("warehouse_id")]
    public Guid WarehouseId { get; set; }

    [Column("status")]
    public ShipmentStatus Status { get; set; } = ShipmentStatus.Draft;

    [Column("expected_delivery_date")]
    public DateTime ExpectedDeliveryDate { get; set; }

    [Column("actual_dispatch_date")]
    public DateTime? ActualDispatchDate { get; set; }

    [Column("actual_arrival_date")]
    public DateTime? ActualArrivalDate { get; set; }

    [StringLength(255)]
    [Column("tracking_number")]
    public string? TrackingNumber { get; set; }

    [StringLength(100)]
    [Column("carrier")]
    public string? Carrier { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Precision(15, 2)]
    [Column("total_value")]
    public decimal? TotalValue { get; set; }

    [Column("total_items")]
    public int TotalItems { get; set; } = 0;

    [Column("total_quantity")]
    public int TotalQuantity { get; set; } = 0;

    [Column("created_by")]
    public Guid? CreatedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("SupplierId")]
    public virtual Supplier Supplier { get; set; } = null!;

    [ForeignKey("WarehouseId")]
    public virtual Warehouse Warehouse { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    public virtual User? Creator { get; set; }

    public virtual ICollection<ShipmentItem> Items { get; set; } = new List<ShipmentItem>();
    public virtual ICollection<ShipmentDocument> Documents { get; set; } = new List<ShipmentDocument>();
    public virtual ICollection<ShipmentStatusHistory> StatusHistory { get; set; } = new List<ShipmentStatusHistory>();
    public virtual ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
    public virtual ICollection<DiscrepancyReport> DiscrepancyReports { get; set; } = new List<DiscrepancyReport>();
    public virtual ICollection<ReturnShipment> ReturnShipments { get; set; } = new List<ReturnShipment>();
}
