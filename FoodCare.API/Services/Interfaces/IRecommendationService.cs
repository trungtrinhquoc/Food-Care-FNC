using FoodCare.API.Models.DTOs.Products;
using FoodCare.API.Models.DTOs.Recommendations;

namespace FoodCare.API.Services.Interfaces;

public interface IRecommendationService
{
    /// <summary>
    /// Get high-rated products (rating >= 4.5)
    /// </summary>
    Task<List<ProductDto>> GetHighRatedProductsAsync(int limit = 8);
    
    /// <summary>
    /// Get trending products based on recent sales (last 7 days)
    /// </summary>
    Task<List<ProductDto>> GetTrendingProductsAsync(int limit = 8);
    
    /// <summary>
    /// Get products the user has purchased before
    /// </summary>
    Task<List<ProductDto>> GetRepurchaseRecommendationsAsync(Guid userId, int limit = 8);
    
    /// <summary>
    /// Get products the user should subscribe to based on purchase frequency
    /// </summary>
    Task<List<SubscriptionRecommendationDto>> GetSubscriptionRecommendationsAsync(Guid userId, int limit = 8);
    
    /// <summary>
    /// Get exclusive deals based on user's membership tier
    /// </summary>
    Task<List<ProductDto>> GetTierExclusiveDealsAsync(Guid userId, int limit = 8);
    
    /// <summary>
    /// Get all personalized recommendations for a user
    /// </summary>
    Task<PersonalizedRecommendationsDto> GetPersonalizedRecommendationsAsync(Guid userId);
    
    // ============ Phase 2.1 Methods ============
    
    /// <summary>
    /// Get products that users who bought similar items also purchased (collaborative filtering)
    /// </summary>
    Task<List<ProductDto>> GetCollaborativeFilteringAsync(Guid userId, int limit = 8);
    
    /// <summary>
    /// Get newly added products (last 30 days)
    /// </summary>
    Task<List<ProductDto>> GetNewArrivalsAsync(int limit = 8);
    
    /// <summary>
    /// Get products with low stock (urgent purchase needed)
    /// </summary>
    Task<List<ProductDto>> GetLowStockUrgentAsync(int limit = 8);
    
    /// <summary>
    /// Get products with biggest discount percentages
    /// </summary>
    Task<List<ProductDto>> GetBiggestDiscountsAsync(int limit = 8);
    
    /// <summary>
    /// Get healthy products (filtered by health tags)
    /// </summary>
    Task<List<ProductDto>> GetHealthyProductsAsync(int limit = 8);
    
    /// <summary>
    /// Get low stock notifications based on user's purchase history and estimated usage
    /// </summary>
    Task<List<LowStockNotificationDto>> GetLowStockNotificationsAsync(Guid userId, int limit = 3);
}
