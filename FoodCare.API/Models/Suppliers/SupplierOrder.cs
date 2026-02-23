using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Suppliers;

[Index("CreatedAt", Name = "ix_supplier_orders_created_at")]
[Index("Status", Name = "ix_supplier_orders_status")]
[Index("SupplierId", Name = "ix_supplier_orders_supplier_id")]
public partial class SupplierOrder
{
    [Key]
    public Guid Id { get; set; }

    [StringLength(255)]
    public string CustomerName { get; set; } = null!;

    [StringLength(255)]
    public string? CustomerEmail { get; set; }

    [StringLength(20)]
    public string? CustomerPhone { get; set; }

    [Precision(15, 2)]
    public decimal TotalAmount { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int SupplierId { get; set; }

    [ForeignKey("SupplierId")]
    [InverseProperty("SupplierOrders")]
    public virtual Supplier Supplier { get; set; } = null!;
}
