using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// History of shipment status changes for audit trail
/// </summary>
[Table("shipment_status_history")]
[Index("ShipmentId", Name = "ix_shipment_status_history_shipment_id")]
[Index("CreatedAt", Name = "ix_shipment_status_history_created_at")]
public class ShipmentStatusHistory
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("shipment_id")]
    public Guid ShipmentId { get; set; }

    [Column("previous_status")]
    public ShipmentStatus? PreviousStatus { get; set; }

    [Column("new_status")]
    public ShipmentStatus NewStatus { get; set; }

    [Column("previous_eta")]
    public DateTime? PreviousEta { get; set; }

    [Column("new_eta")]
    public DateTime? NewEta { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("changed_by")]
    public Guid? ChangedBy { get; set; }

    /// <summary>
    /// Alias for NewStatus - used by services for simpler access
    /// </summary>
    [NotMapped]
    public ShipmentStatus Status
    {
        get => NewStatus;
        set => NewStatus = value;
    }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ShipmentId")]
    public virtual SupplierShipment Shipment { get; set; } = null!;

    [ForeignKey("ChangedBy")]
    public virtual User? ChangedByUser { get; set; }
}
