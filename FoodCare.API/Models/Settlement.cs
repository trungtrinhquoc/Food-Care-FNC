using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models;

[Index("SupplierId", "Month", "Year", Name = "ix_settlements_supplier_period", IsUnique = true)]
[Index("IsPaid", Name = "ix_settlements_is_paid")]
public class Settlement
{
    [Key]
    public Guid Id { get; set; }

    public int SupplierId { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    [Precision(15, 2)]
    public decimal TotalSales { get; set; }

    [Precision(5, 2)]
    public decimal CommissionRate { get; set; }

    [Precision(15, 2)]
    public decimal CommissionAmount { get; set; }

    [Precision(15, 2)]
    public decimal AmountDue { get; set; }

    public bool IsPaid { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? PaidAt { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("SupplierId")]
    public virtual Supplier Supplier { get; set; } = null!;
}
