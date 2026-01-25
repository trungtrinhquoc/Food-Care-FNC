using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Products;
using FoodCare.API.Models.DTOs.Recommendations;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations;

public class RecommendationService : IRecommendationService
{
    private readonly FoodCareDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
        FoodCareDbContext context,
        IMapper mapper,
        ILogger<RecommendationService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<ProductDto>> GetHighRatedProductsAsync(int limit = 8)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive == true && 
                       p.IsDeleted == false && 
                       p.RatingAverage >= 4.5m)
            .OrderByDescending(p => p.RatingAverage)
            .ThenByDescending(p => p.RatingCount)
            .Take(limit)
            .ToListAsync();

        return _mapper.Map<List<ProductDto>>(products);
    }

    public async Task<List<ProductDto>> GetTrendingProductsAsync(int limit = 8)
    {
        try
        {
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

            // Get products with most orders in the last 7 days
            var trendingProducts = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                    .ThenInclude(p => p!.Category)
                .Where(oi => oi.Order!.CreatedAt >= sevenDaysAgo &&
                            oi.Product!.IsActive == true &&
                            oi.Product.IsDeleted == false)
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    OrderCount = g.Count(),
                    Product = g.First().Product
                })
                .ToListAsync(); // Execute query first

            // Then sort in memory to avoid EF Core translation issues
            var sortedProducts = trendingProducts
                .OrderByDescending(x => x.OrderCount)
                .ThenByDescending(x => x.Product!.RatingAverage ?? 0)
                .Take(limit)
                .ToList();

            // If no trending products found, return high-rated products instead
            if (sortedProducts.Count == 0)
            {
                _logger.LogInformation("No trending products found in last 7 days, returning high-rated products instead");
                return await GetHighRatedProductsAsync(limit);
            }

            var products = sortedProducts.Select(x => x.Product!).ToList();
            return _mapper.Map<List<ProductDto>>(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trending products, falling back to high-rated");
            // Fallback to high-rated products if trending query fails
            return await GetHighRatedProductsAsync(limit);
        }
    }

    public async Task<List<ProductDto>> GetRepurchaseRecommendationsAsync(Guid userId, int limit = 8)
    {
        // Get products the user has purchased before
        var purchasedProducts = await _context.OrderItems
            .Include(oi => oi.Product)
                .ThenInclude(p => p!.Category)
            .Where(oi => oi.Order!.UserId == userId &&
                        oi.Product!.IsActive == true &&
                        oi.Product.IsDeleted == false)
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                LastPurchased = g.Max(oi => oi.Order!.CreatedAt),
                Product = g.First().Product
            })
            .OrderByDescending(x => x.LastPurchased)
            .Take(limit)
            .ToListAsync();

        var products = purchasedProducts.Select(x => x.Product!).ToList();
        return _mapper.Map<List<ProductDto>>(products);
    }

    public async Task<List<SubscriptionRecommendationDto>> GetSubscriptionRecommendationsAsync(Guid userId, int limit = 8)
    {
        var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);

        // Find products user has purchased 2+ times in the last 90 days
        var frequentPurchases = await _context.OrderItems
            .Include(oi => oi.Product)
                .ThenInclude(p => p!.Category)
            .Where(oi => oi.Order!.UserId == userId &&
                        oi.Order.CreatedAt >= ninetyDaysAgo &&
                        oi.Product!.IsActive == true &&
                        oi.Product.IsDeleted == false &&
                        oi.Product.IsSubscriptionAvailable == true)
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                PurchaseCount = g.Count(),
                Product = g.First().Product,
                TotalSpent = g.Sum(oi => oi.Quantity * oi.Price)
            })
            .Where(x => x.PurchaseCount >= 2)
            .OrderByDescending(x => x.PurchaseCount)
            .ThenByDescending(x => x.TotalSpent)
            .Take(limit)
            .ToListAsync();

        var recommendations = new List<SubscriptionRecommendationDto>();

        foreach (var purchase in frequentPurchases)
        {
            var productDto = _mapper.Map<ProductDto>(purchase.Product);
            
            // Calculate potential savings (assuming 15% subscription discount for weekly)
            var subscriptionDiscount = 0.15m; // 15% for weekly subscription
            var yearlySavings = purchase.Product!.BasePrice * 52 * subscriptionDiscount; // 52 weeks

            var recommendedFrequency = purchase.PurchaseCount >= 8 ? "weekly" : 
                                      purchase.PurchaseCount >= 4 ? "biweekly" : "monthly";

            recommendations.Add(new SubscriptionRecommendationDto
            {
                Product = productDto,
                PurchaseCount = purchase.PurchaseCount,
                PotentialYearlySavings = yearlySavings,
                RecommendedFrequency = recommendedFrequency,
                SubscriptionDiscount = subscriptionDiscount * 100 // Convert to percentage
            });
        }

        return recommendations;
    }

    public async Task<List<ProductDto>> GetTierExclusiveDealsAsync(Guid userId, int limit = 8)
    {
        // Get user's tier
        var user = await _context.Users
            .Include(u => u.Tier)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user?.TierId == null)
        {
            // Return high-discount products for users without tier
            return await GetHighDiscountProductsAsync(limit);
        }

        // Get products with high discounts that are popular among users in the same tier
        var tierProducts = await _context.OrderItems
            .Include(oi => oi.Product)
                .ThenInclude(p => p!.Category)
            .Where(oi => oi.Order!.User!.TierId == user.TierId &&
                        oi.Product!.IsActive == true &&
                        oi.Product.IsDeleted == false &&
                        oi.Product.OriginalPrice != null &&
                        oi.Product.OriginalPrice > oi.Product.BasePrice)
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                OrderCount = g.Count(),
                Product = g.First().Product,
                DiscountPercentage = (g.First().Product != null && g.First().Product!.OriginalPrice.HasValue && g.First().Product!.OriginalPrice.Value != 0) 
                    ? ((g.First().Product!.OriginalPrice.Value - g.First().Product!.BasePrice) / g.First().Product!.OriginalPrice.Value) * 100 
                    : 0
            })
            .OrderByDescending(x => x.DiscountPercentage)
            .ThenByDescending(x => x.OrderCount)
            .Take(limit)
            .ToListAsync();

        var products = tierProducts.Select(x => x.Product!).ToList();
        return _mapper.Map<List<ProductDto>>(products);
    }

    public async Task<PersonalizedRecommendationsDto> GetPersonalizedRecommendationsAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.Tier)
            .FirstOrDefaultAsync(u => u.Id == userId);

        var recommendations = new PersonalizedRecommendationsDto
        {
            UserTierName = user?.Tier?.Name ?? "Bronze",
            HighRated = await GetHighRatedProductsAsync(8),
            Trending = await GetTrendingProductsAsync(8),
            Repurchase = await GetRepurchaseRecommendationsAsync(userId, 8),
            SubscriptionWorthy = await GetSubscriptionRecommendationsAsync(userId, 8),
            TierExclusive = await GetTierExclusiveDealsAsync(userId, 8)
        };

        // "For You" combines repurchase and trending products
        recommendations.ForYou = recommendations.Repurchase
            .Take(4)
            .Concat(recommendations.Trending.Take(4))
            .ToList();

        return recommendations;
    }

    // Helper method
    private async Task<List<ProductDto>> GetHighDiscountProductsAsync(int limit)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive == true &&
                       p.IsDeleted == false &&
                       p.OriginalPrice != null &&
                       p.OriginalPrice > p.BasePrice)
            .OrderByDescending(p => (p.OriginalPrice - p.BasePrice) / p.OriginalPrice)
            .Take(limit)
            .ToListAsync();

        return _mapper.Map<List<ProductDto>>(products);
    }

    // ============ Phase 2.1 Methods ============

    public async Task<List<ProductDto>> GetCollaborativeFilteringAsync(Guid userId, int limit = 8)
    {
        try
        {
            // Get products the user has purchased
            var userProducts = await _context.OrderItems
                .Where(oi => oi.Order!.UserId == userId)
                .Select(oi => oi.ProductId)
                .Distinct()
                .ToListAsync();

            if (userProducts.Count == 0)
            {
                // The provided code snippet was syntactically incorrect and out of context for this method.
                // Assuming the intent was to return trending products if no user history.
                return await GetTrendingProductsAsync(limit);
            }

            // Find other users who bought the same products
            var similarUsers = await _context.OrderItems
                .Where(oi => userProducts.Contains(oi.ProductId!.Value) && 
                            oi.Order!.UserId != userId)
                .Select(oi => oi.Order!.UserId)
                .Distinct()
                .ToListAsync();

            if (similarUsers.Count == 0)
            {
                return await GetHighRatedProductsAsync(limit);
            }

            // Get products those similar users bought (that current user hasn't)
            var recommendedProducts = await _context.OrderItems
                .Include(oi => oi.Product)
                    .ThenInclude(p => p!.Category)
                .Where(oi => similarUsers.Contains(oi.Order!.UserId!.Value) &&
                            !userProducts.Contains(oi.ProductId!.Value) &&
                            oi.Product!.IsActive == true &&
                            oi.Product.IsDeleted == false)
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    PurchaseCount = g.Count(),
                    Product = g.First().Product
                })
                .ToListAsync();

            var sortedProducts = recommendedProducts
                .OrderByDescending(x => x.PurchaseCount)
                .ThenByDescending(x => x.Product!.RatingAverage ?? 0)
                .Take(limit)
                .Select(x => x.Product!)
                .ToList();

            return _mapper.Map<List<ProductDto>>(sortedProducts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in collaborative filtering");
            return await GetHighRatedProductsAsync(limit);
        }
    }

    public async Task<List<ProductDto>> GetNewArrivalsAsync(int limit = 8)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive == true &&
                       p.IsDeleted == false &&
                       p.CreatedAt >= thirtyDaysAgo)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return _mapper.Map<List<ProductDto>>(products);
    }

    public async Task<List<ProductDto>> GetLowStockUrgentAsync(int limit = 8)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive == true &&
                       p.IsDeleted == false &&
                       p.StockQuantity != null &&
                       p.LowStockThreshold != null &&
                       p.StockQuantity > 0 &&
                       p.StockQuantity <= p.LowStockThreshold)
            .OrderBy(p => p.StockQuantity)
            .Take(limit)
            .ToListAsync();

        return _mapper.Map<List<ProductDto>>(products);
    }

    public async Task<List<ProductDto>> GetBiggestDiscountsAsync(int limit = 8)
    {
        // Reuse the existing helper method
        return await GetHighDiscountProductsAsync(limit);
    }

    public async Task<List<ProductDto>> GetHealthyProductsAsync(int limit = 8)
    {
        // Filter products by health-related tags
        // Note: This assumes products have tags. If not, this will return empty.
        // You may need to add a Tags column to the Products table first.
        
        var healthTags = new[] { "organic", "healthy", "low-sugar", "high-protein", "gluten-free", "vegan", "natural" };

        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive == true &&
                       p.IsDeleted == false &&
                       p.Tags != null &&
                       p.Tags.Any(tag => healthTags.Contains(tag.ToLower())))
            .OrderByDescending(p => p.RatingAverage)
            .Take(limit)
            .ToListAsync();

        // If no products with health tags, return high-rated products
        if (products.Count == 0)
        {
            _logger.LogInformation("No healthy products found with tags, returning high-rated products");
            return await GetHighRatedProductsAsync(limit);
        }

        return _mapper.Map<List<ProductDto>>(products);
    }
    
    public async Task<List<LowStockNotificationDto>> GetLowStockNotificationsAsync(Guid userId, int limit = 3)
    {
        var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);
        
        // Get user's purchase history for frequently bought items
        var purchaseHistory = await _context.OrderItems
            .Include(oi => oi.Product)
                .ThenInclude(p => p!.Category)
            .Include(oi => oi.Order)
            .Where(oi => oi.Order!.UserId == userId &&
                        oi.Order.CreatedAt >= ninetyDaysAgo &&
                        oi.Product!.IsActive == true &&
                        oi.Product.IsDeleted == false)
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                Product = g.First().Product,
                PurchaseCount = g.Count(),
                FirstPurchase = g.Min(oi => oi.Order!.CreatedAt),
                LastPurchase = g.Max(oi => oi.Order!.CreatedAt),
                PurchaseDates = g.Select(oi => oi.Order!.CreatedAt).OrderBy(d => d).ToList()
            })
            .Where(x => x.PurchaseCount >= 2) // Only products purchased at least twice
            .ToListAsync();
        
        var notifications = new List<LowStockNotificationDto>();
        
        foreach (var purchase in purchaseHistory)
        {
            // Calculate average days between purchases
            var daysBetweenPurchases = new List<int>();
            for (int i = 1; i < purchase.PurchaseDates.Count; i++)
            {
                var d1 = purchase.PurchaseDates[i];
                var d2 = purchase.PurchaseDates[i - 1];
                
                if (d1.HasValue && d2.HasValue)
                {
                    var days = (d1.Value - d2.Value).Days;
                    daysBetweenPurchases.Add(days);
                }
            }
            
            var averageUsageDays = daysBetweenPurchases.Count > 0 
                ? (int)daysBetweenPurchases.Average() 
                : 30; // Default to 30 days if only one purchase
            
            // Calculate days since last purchase
            var daysSinceLastPurchase = 0;
            if (purchase.LastPurchase.HasValue)
            {
                daysSinceLastPurchase = (DateTime.UtcNow - purchase.LastPurchase.Value).Days;
            }
            
            // Estimate days left (with some buffer)
            var estimatedDaysLeft = Math.Max(0, averageUsageDays - daysSinceLastPurchase);
            
            // Only notify if estimated to run out within 7 days
            if (estimatedDaysLeft <= 7 && purchase.LastPurchase.HasValue)
            {
                var productDto = _mapper.Map<ProductDto>(purchase.Product);
                
                notifications.Add(new LowStockNotificationDto
                {
                    Product = productDto,
                    LastPurchaseDate = purchase.LastPurchase.Value,
                    EstimatedDaysLeft = estimatedDaysLeft,
                    AverageUsageDays = averageUsageDays,
                    PurchaseCount = purchase.PurchaseCount
                });
            }
        }
        
        // Sort by urgency (least days left first)
        var sortedNotifications = notifications
            .OrderBy(n => n.EstimatedDaysLeft)
            .ThenByDescending(n => n.PurchaseCount)
            .Take(limit)
            .ToList();
        
        return sortedNotifications;
    }
}
