using FoodCare.API.Models.DTOs.Products;

namespace FoodCare.API.Models.DTOs.Recommendations;

public class SubscriptionRecommendationDto
{
    public ProductDto Product { get; set; } = null!;
    
    public int PurchaseCount { get; set; }
    
    public decimal PotentialYearlySavings { get; set; }
    
    public string RecommendedFrequency { get; set; } = null!; // "weekly", "biweekly", "monthly"
    
    public decimal SubscriptionDiscount { get; set; } // Percentage discount for subscription
}
