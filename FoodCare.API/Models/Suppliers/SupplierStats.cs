using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Models.Suppliers;

[Index("Date", Name = "ix_supplier_stats_date")]
[Index("SupplierId", Name = "ix_supplier_stats_supplier_id")]
public partial class SupplierStats
{
    [Key]
    public Guid Id { get; set; }

    public int SupplierId { get; set; }

    public DateTime? Date { get; set; }

    public int TotalProducts { get; set; }

    public int ActiveProducts { get; set; }

    public int LowStockProducts { get; set; }

    public int TotalOrders { get; set; }

    public int PendingOrders { get; set; }

    public int CompletedOrders { get; set; }

    public int CancelledOrders { get; set; }

    [Precision(15, 2)]
    public decimal TotalRevenue { get; set; }

    [Precision(15, 2)]
    public decimal ThisMonthRevenue { get; set; }

    [Precision(15, 2)]
    public decimal LastMonthRevenue { get; set; }

    public double AverageOrderValue { get; set; }

    public double FulfillmentRate { get; set; }

    public double OnTimeDeliveryRate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey("SupplierId")]
    [InverseProperty("SupplierStats")]
    public virtual Supplier Supplier { get; set; } = null!;
}
