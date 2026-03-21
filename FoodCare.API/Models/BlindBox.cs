using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Models;

public class BlindBox
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int SupplierId { get; set; }
    [MaxLength(200)] public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    [Column(TypeName = "decimal(15,2)")] public decimal OriginalValue { get; set; }
    [Column(TypeName = "decimal(15,2)")] public decimal BlindBoxPrice { get; set; }
    public int Quantity { get; set; }
    public int QuantitySold { get; set; } = 0;
    public DateTime ExpiryDate { get; set; }         // latest expiry of products inside
    public string? Contents { get; set; }             // JSON: [{ "name": "Cà rốt", "qty": 2 }]
    public string? ImageUrl { get; set; }
    [MaxLength(50)] public string Status { get; set; } = "pending"; // pending|approved|active|sold_out|archived
    [MaxLength(2)] public string? Tier { get; set; } // S or M
    [Column(TypeName = "decimal(15,2)")] public decimal? SellPrice { get; set; }
    public bool? DeliverWithSubscription { get; set; }
    public string? RejectionReason { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    // Navigation
    public Supplier Supplier { get; set; } = null!;
}
