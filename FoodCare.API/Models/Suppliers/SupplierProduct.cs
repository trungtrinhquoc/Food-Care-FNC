using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Suppliers;

[Index("IsActive", Name = "ix_supplier_products_is_active")]
[Index("Sku", Name = "ix_supplier_products_sku")]
[Index("SupplierId", Name = "ix_supplier_products_supplier_id")]
public partial class SupplierProduct
{
    [Key]
    public Guid Id { get; set; }

    [StringLength(255)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Precision(15, 2)]
    public decimal BasePrice { get; set; }

    [Precision(15, 2)]
    public decimal? CostPrice { get; set; }

    public int StockQuantity { get; set; }

    public int LowStockThreshold { get; set; }

    [StringLength(50)]
    public string? Sku { get; set; }

    [StringLength(255)]
    public string? ImageUrl { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int SupplierId { get; set; }

    [ForeignKey("SupplierId")]
    [InverseProperty("SupplierProducts")]
    public virtual Supplier Supplier { get; set; } = null!;
}
