using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Generic admin action audit log for governance tracking.
/// Records all admin interventions on entities (shipments, suppliers, etc.)
/// </summary>
[Table("admin_action_logs")]
[Index("EntityType", "EntityId", Name = "ix_admin_action_logs_entity")]
[Index("AdminId", Name = "ix_admin_action_logs_admin_id")]
[Index("CreatedAt", Name = "ix_admin_action_logs_created_at")]
[Index("Action", Name = "ix_admin_action_logs_action")]
public class AdminActionLog
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>
    /// Type of entity being acted upon (e.g., "SupplierShipment", "Supplier")
    /// </summary>
    [Required]
    [StringLength(50)]
    [Column("entity_type")]
    public string EntityType { get; set; } = null!;

    /// <summary>
    /// ID of the target entity (stored as string for flexibility across Guid/int PKs)
    /// </summary>
    [Required]
    [StringLength(100)]
    [Column("entity_id")]
    public string EntityId { get; set; } = null!;

    /// <summary>
    /// Admin user who performed the action
    /// </summary>
    [Column("admin_id")]
    public Guid AdminId { get; set; }

    /// <summary>
    /// Action performed (e.g., "approve", "reject", "hold", "override_status", "force_close", "resume")
    /// </summary>
    [Required]
    [StringLength(100)]
    [Column("action")]
    public string Action { get; set; } = null!;

    /// <summary>
    /// Previous status before the action
    /// </summary>
    [StringLength(50)]
    [Column("old_status")]
    public string? OldStatus { get; set; }

    /// <summary>
    /// New status after the action
    /// </summary>
    [StringLength(50)]
    [Column("new_status")]
    public string? NewStatus { get; set; }

    /// <summary>
    /// Reason for the action (mandatory for reject, hold, override)
    /// </summary>
    [Column("reason")]
    public string? Reason { get; set; }

    /// <summary>
    /// Additional metadata in JSON format (e.g., old/new ETA, affected items)
    /// </summary>
    [Column("metadata", TypeName = "jsonb")]
    public string? Metadata { get; set; }

    /// <summary>
    /// IP address of the admin performing the action
    /// </summary>
    [StringLength(45)]
    [Column("ip_address")]
    public string? IpAddress { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("AdminId")]
    public virtual User Admin { get; set; } = null!;
}
