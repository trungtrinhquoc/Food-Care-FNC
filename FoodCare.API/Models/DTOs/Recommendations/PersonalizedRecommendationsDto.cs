using FoodCare.API.Models.DTOs.Products;

namespace FoodCare.API.Models.DTOs.Recommendations;

public class PersonalizedRecommendationsDto
{
    public List<ProductDto> ForYou { get; set; } = new();
    
    public List<ProductDto> HighRated { get; set; } = new();
    
    public List<ProductDto> Trending { get; set; } = new();
    
    public List<ProductDto> Repurchase { get; set; } = new();
    
    public List<SubscriptionRecommendationDto> SubscriptionWorthy { get; set; } = new();
    
    public List<ProductDto> TierExclusive { get; set; } = new();
    
    public string? UserTierName { get; set; }
}
