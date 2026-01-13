using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class OrderItem
{
    public Guid Id { get; set; }

    public Guid? OrderId { get; set; }

    public Guid? ProductId { get; set; }

    public string ProductName { get; set; } = null!;

    public string? VariantSnapshot { get; set; }

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public decimal? TotalPrice { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Order? Order { get; set; }

    public virtual Product? Product { get; set; }
}
