using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Warehouse location for inventory management
/// </summary>
[Table("warehouses")]
[Index("Code", Name = "ix_warehouses_code", IsUnique = true)]
[Index("IsActive", Name = "ix_warehouses_is_active")]
[Index("Region", Name = "ix_warehouses_region")]
public class Warehouse
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("code")]
    public string Code { get; set; } = null!;

    [Required]
    [StringLength(255)]
    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Region for auto-assignment: North, Central, South
    /// </summary>
    [StringLength(50)]
    [Column("region")]
    public string? Region { get; set; }

    [StringLength(500)]
    [Column("address_street")]
    public string? AddressStreet { get; set; }

    [StringLength(100)]
    [Column("address_ward")]
    public string? AddressWard { get; set; }

    [StringLength(100)]
    [Column("address_district")]
    public string? AddressDistrict { get; set; }

    [StringLength(100)]
    [Column("address_city")]
    public string? AddressCity { get; set; }

    [StringLength(20)]
    [Column("phone")]
    public string? Phone { get; set; }

    [StringLength(255)]
    [Column("email")]
    public string? Email { get; set; }

    [Precision(10, 8)]
    [Column("latitude")]
    public decimal? Latitude { get; set; }

    [Precision(11, 8)]
    [Column("longitude")]
    public decimal? Longitude { get; set; }

    [Column("capacity")]
    public int? Capacity { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("is_default")]
    public bool IsDefault { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<StaffMember> StaffMembers { get; set; } = new List<StaffMember>();
    public virtual ICollection<StaffWarehouse> StaffWarehouses { get; set; } = new List<StaffWarehouse>();
    public virtual ICollection<WarehouseInventory> Inventories { get; set; } = new List<WarehouseInventory>();
    public virtual ICollection<SupplierShipment> Shipments { get; set; } = new List<SupplierShipment>();
    public virtual ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
}
