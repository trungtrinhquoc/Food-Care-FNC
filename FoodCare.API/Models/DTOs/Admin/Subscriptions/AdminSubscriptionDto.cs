namespace FoodCare.API.Models.DTOs.Admin.Subscriptions;

public class AdminSubscriptionDto
{
    public Guid Id { get; set; }
    
    // Customer Info
    public Guid UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    
    // Product Info
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public decimal ProductPrice { get; set; }
    
    // Subscription Info
    public string Frequency { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal DiscountPercent { get; set; }
    public string Status { get; set; } = string.Empty;
    
    // Dates
    public DateTime StartDate { get; set; }
    public DateTime NextDeliveryDate { get; set; }
    public DateTime? PauseUntil { get; set; }
    public DateTime CreatedAt { get; set; }
}
