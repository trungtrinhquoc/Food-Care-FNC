namespace FoodCare.API.Models.DTOs.Admin.Subscriptions;

public class AdminSubscriptionDetailDto
{
    public Guid Id { get; set; }
    
    // Customer Info
    public Guid UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerTier { get; set; }
    
    // Shipping Address
    public string? ShippingStreet { get; set; }
    public string? ShippingWard { get; set; }
    public string? ShippingDistrict { get; set; }
    public string? ShippingCity { get; set; }
    public string? ShippingFullAddress { get; set; }
    
    // Product Info
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductDescription { get; set; }
    public string? ProductImage { get; set; }
    public decimal ProductPrice { get; set; }
    public string? ProductCategory { get; set; }
    
    // Subscription Info
    public string Frequency { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal DiscountPercent { get; set; }
    public string Status { get; set; } = string.Empty;
    
    // Payment Info
    public string? PaymentMethodType { get; set; }
    public string? PaymentMethodDetails { get; set; }
    
    // Dates
    public DateTime StartDate { get; set; }
    public DateTime NextDeliveryDate { get; set; }
    public DateTime? PauseUntil { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Statistics
    public int TotalOrdersCreated { get; set; }
    public decimal TotalRevenue { get; set; }
    public DateTime? LastOrderDate { get; set; }
    
    // Email History
    public int RemindersSent { get; set; }
    public DateTime? LastReminderSent { get; set; }
}
