using System;
using System.Collections.Generic;
using FoodCare.API.Models.Suppliers;
using NpgsqlTypes;

namespace FoodCare.API.Models;

public partial class Product
{
    public Guid Id { get; set; }

    public int? SupplierId { get; set; }

    public int? CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string? Description { get; set; }

    public string? Images { get; set; }

    public decimal BasePrice { get; set; }

    public decimal? OriginalPrice { get; set; }

    public decimal? CostPrice { get; set; }

    public string? Sku { get; set; }

    public int? StockQuantity { get; set; }

    public int? LowStockThreshold { get; set; }

    public bool? IsSubscriptionAvailable { get; set; }

    public string? SubscriptionDiscounts { get; set; }

    public decimal? RatingAverage { get; set; }

    public int? RatingCount { get; set; }

    public string? MetaTitle { get; set; }

    public string? MetaDescription { get; set; }

    public List<string>? Tags { get; set; }

    public NpgsqlTsVector? SearchVector { get; set; }

    public bool? IsActive { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Approval workflow fields
    [System.ComponentModel.DataAnnotations.StringLength(20)]
    public string? ApprovalStatus { get; set; } = "pending";

    public string? ApprovalNotes { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public Guid? ApprovedBy { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public DateTime? RejectedAt { get; set; }

    public virtual Category? Category { get; set; }

    public virtual ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();

    public virtual Supplier? Supplier { get; set; }

    // Computed properties for backward compatibility
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string? ImageUrl
    {
        get => Images;
        set => Images = value;
    }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public decimal Price
    {
        get => BasePrice;
        set => BasePrice = value;
    }
}
