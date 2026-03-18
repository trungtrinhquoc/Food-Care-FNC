using System;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models;

public class Complaint
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
    public Guid UserId { get; set; }
    public int? SupplierId { get; set; }
    public string Type { get; set; } = string.Empty;       // "Không nhận hàng" | "Thiếu sản phẩm" | "Hàng hỏng"
    public string Priority { get; set; } = "medium";       // "high" | "medium" | "low"
    public string Status { get; set; } = "pending";        // "pending" | "investigating" | "resolved" | "rejected"
    public string Description { get; set; } = string.Empty;
    public string? ImageUrls { get; set; }                 // JSON array string
    public string? AdminNote { get; set; }
    public decimal? RefundAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User? User { get; set; }
    public virtual Order? Order { get; set; }
    public virtual Supplier? Supplier { get; set; }
}
