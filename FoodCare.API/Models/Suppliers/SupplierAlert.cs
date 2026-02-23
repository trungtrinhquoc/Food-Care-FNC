using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Suppliers;

[Index("IsRead", Name = "ix_supplier_alerts_is_read")]
[Index("SupplierId", Name = "ix_supplier_alerts_supplier_id")]
[Index("Type", Name = "ix_supplier_alerts_type")]
public partial class SupplierAlert
{
    [Key]
    public Guid Id { get; set; }

    [StringLength(50)]
    public string Type { get; set; } = null!;

    [StringLength(255)]
    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    [StringLength(20)]
    public string Severity { get; set; } = null!;

    public bool? IsRead { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ReadAt { get; set; }

    public Guid? ProductId { get; set; }

    public Guid? OrderId { get; set; }

    public int SupplierId { get; set; }

    [Column(TypeName = "jsonb")]
    public string? Data { get; set; }

    [ForeignKey("SupplierId")]
    [InverseProperty("SupplierAlerts")]
    public virtual Supplier Supplier { get; set; } = null!;
}
