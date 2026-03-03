using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models.Staff;

/// <summary>
/// Tracks supplier registrations for inbound sessions.
/// When a session is created, suppliers in the same district as the warehouse
/// are notified and can register to send goods.
/// </summary>
[Table("inbound_session_suppliers")]
public class InboundSessionSupplier
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("session_id")]
    public Guid SessionId { get; set; }

    [Column("supplier_id")]
    public int SupplierId { get; set; }

    /// <summary>
    /// Status: Invited (auto-notified), Registered (supplier confirmed),
    /// Declined (supplier declined), Completed (goods delivered)
    /// </summary>
    [Required]
    [StringLength(30)]
    [Column("status")]
    public string Status { get; set; } = "Invited";

    /// <summary>Note from supplier when registering</summary>
    [StringLength(500)]
    [Column("note")]
    public string? Note { get; set; }

    /// <summary>Estimated delivery date provided by supplier</summary>
    [Column("estimated_delivery_date")]
    public DateTime? EstimatedDeliveryDate { get; set; }

    [Column("registered_at")]
    public DateTime? RegisteredAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SessionId")]
    public virtual InboundSession Session { get; set; } = null!;

    [ForeignKey("SupplierId")]
    public virtual Supplier Supplier { get; set; } = null!;
}
