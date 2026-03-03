using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Staff member who works in warehouses
/// </summary>
[Table("staff_members")]
[Index("UserId", Name = "ix_staff_members_user_id")]
[Index("EmployeeCode", Name = "ix_staff_members_employee_code", IsUnique = true)]
[Index("IsActive", Name = "ix_staff_members_is_active")]
public class StaffMember
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [StringLength(50)]
    [Column("employee_code")]
    public string EmployeeCode { get; set; } = null!;

    [StringLength(100)]
    [Column("department")]
    public string? Department { get; set; }

    [StringLength(100)]
    [Column("position")]
    public string? Position { get; set; }

    [Column("staff_position")]
    public StaffPosition? StaffPositionEnum { get; set; }

    [Column("warehouse_id")]
    public Guid? WarehouseId { get; set; }

    [Column("can_approve_receipts")]
    public bool CanApproveReceipts { get; set; } = false;

    [Column("can_adjust_inventory")]
    public bool CanAdjustInventory { get; set; } = false;

    [Column("can_override_fifo")]
    public bool CanOverrideFifo { get; set; } = false;

    [Column("can_create_inbound_session")]
    public bool CanCreateInboundSession { get; set; } = false;

    [Column("hire_date")]
    public DateTime? HireDate { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("WarehouseId")]
    public virtual Warehouse? Warehouse { get; set; }

    public virtual ICollection<StaffWarehouse> StaffWarehouses { get; set; } = new List<StaffWarehouse>();
    public virtual ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
    public virtual ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public virtual ICollection<DiscrepancyReport> DiscrepancyReports { get; set; } = new List<DiscrepancyReport>();
}
