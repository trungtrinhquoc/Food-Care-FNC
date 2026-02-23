using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Receipt record when staff receives a shipment at warehouse
/// </summary>
[Table("receipts")]
[Index("ShipmentId", Name = "ix_receipts_shipment_id")]
[Index("WarehouseId", Name = "ix_receipts_warehouse_id")]
[Index("ReceivedBy", Name = "ix_receipts_received_by")]
[Index("Status", Name = "ix_receipts_status")]
[Index("ReceiptNumber", Name = "ix_receipts_receipt_number", IsUnique = true)]
public class Receipt
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("receipt_number")]
    public string ReceiptNumber { get; set; } = null!;

    [Column("shipment_id")]
    public Guid ShipmentId { get; set; }

    [Column("warehouse_id")]
    public Guid WarehouseId { get; set; }

    [Column("received_by")]
    public Guid ReceivedBy { get; set; }

    [Column("inspected_by")]
    public Guid? InspectedBy { get; set; }

    [Column("status")]
    public ReceiptStatus Status { get; set; } = ReceiptStatus.Pending;

    [Column("arrival_date")]
    public DateTime ArrivalDate { get; set; }

    [Column("inspection_start")]
    public DateTime? InspectionStart { get; set; }

    [Column("inspection_end")]
    public DateTime? InspectionEnd { get; set; }

    [Column("store_date")]
    public DateTime? StoreDate { get; set; }

    [Column("total_expected")]
    public int TotalExpected { get; set; }

    [Column("total_accepted")]
    public int TotalAccepted { get; set; }

    [Column("total_damaged")]
    public int TotalDamaged { get; set; }

    [Column("total_missing")]
    public int TotalMissing { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("inspection_notes")]
    public string? InspectionNotes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("ShipmentId")]
    public virtual SupplierShipment Shipment { get; set; } = null!;

    [ForeignKey("WarehouseId")]
    public virtual Warehouse Warehouse { get; set; } = null!;

    [ForeignKey("ReceivedBy")]
    public virtual StaffMember ReceivedByStaff { get; set; } = null!;

    [ForeignKey("InspectedBy")]
    public virtual StaffMember? InspectedByStaff { get; set; }

    public virtual ICollection<ReceiptItem> Items { get; set; } = new List<ReceiptItem>();
}
