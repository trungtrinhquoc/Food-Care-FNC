using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Join table: Staff ↔ Warehouse (many-to-many)
/// A staff member can be assigned to multiple warehouses.
/// </summary>
[Table("staff_warehouses")]
public class StaffWarehouse
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("staff_id")]
    public Guid StaffId { get; set; }

    [Column("warehouse_id")]
    public Guid WarehouseId { get; set; }

    [Column("is_primary")]
    public bool IsPrimary { get; set; } = false;

    [Column("assigned_at")]
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    [Column("assigned_by")]
    public Guid? AssignedBy { get; set; }

    // Navigation properties
    [ForeignKey("StaffId")]
    public virtual StaffMember Staff { get; set; } = null!;

    [ForeignKey("WarehouseId")]
    public virtual Warehouse Warehouse { get; set; } = null!;
}
