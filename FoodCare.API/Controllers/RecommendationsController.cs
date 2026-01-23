using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _recommendationService;
    private readonly ILogger<RecommendationsController> _logger;

    public RecommendationsController(
        IRecommendationService recommendationService,
        ILogger<RecommendationsController> logger)
    {
        _recommendationService = recommendationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all personalized recommendations for authenticated user
    /// </summary>
    [HttpGet("for-you")]
    [Authorize]
    public async Task<IActionResult> GetPersonalizedRecommendations()
    {
        try
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var recommendations = await _recommendationService.GetPersonalizedRecommendationsAsync(userId);
            return Ok(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting personalized recommendations");
            return StatusCode(500, new { message = "An error occurred while retrieving recommendations" });
        }
    }

    /// <summary>
    /// Get high-rated products (rating >= 4.5)
    /// </summary>
    [HttpGet("high-rated")]
    public async Task<IActionResult> GetHighRatedProducts([FromQuery] int limit = 8)
    {
        try
        {
            var products = await _recommendationService.GetHighRatedProductsAsync(limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting high-rated products");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get trending products based on recent sales
    /// </summary>
    [HttpGet("trending")]
    public async Task<IActionResult> GetTrendingProducts([FromQuery] int limit = 8)
    {
        try
        {
            var products = await _recommendationService.GetTrendingProductsAsync(limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trending products");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get products user has purchased before
    /// </summary>
    [HttpGet("repurchase")]
    [Authorize]
    public async Task<IActionResult> GetRepurchaseRecommendations([FromQuery] int limit = 8)
    {
        try
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var products = await _recommendationService.GetRepurchaseRecommendationsAsync(userId, limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting repurchase recommendations");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get products user should subscribe to based on purchase frequency
    /// </summary>
    [HttpGet("subscription-worthy")]
    [Authorize]
    public async Task<IActionResult> GetSubscriptionRecommendations([FromQuery] int limit = 8)
    {
        try
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var recommendations = await _recommendationService.GetSubscriptionRecommendationsAsync(userId, limit);
            return Ok(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subscription recommendations");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get exclusive deals based on user's membership tier
    /// </summary>
    [HttpGet("tier-exclusive")]
    [Authorize]
    public async Task<IActionResult> GetTierExclusiveDeals([FromQuery] int limit = 8)
    {
        try
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var products = await _recommendationService.GetTierExclusiveDealsAsync(userId, limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tier-exclusive deals");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // Helper method to get user ID from JWT claims
    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    // ============ Phase 2.1 Endpoints ============

    /// <summary>
    /// Get collaborative filtering recommendations (users who bought X also bought Y)
    /// </summary>
    [HttpGet("you-may-like")]
    [Authorize]
    public async Task<IActionResult> GetCollaborativeFiltering([FromQuery] int limit = 8)
    {
        try
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var products = await _recommendationService.GetCollaborativeFilteringAsync(userId, limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting collaborative filtering recommendations");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get new arrivals (products added in last 30 days)
    /// </summary>
    [HttpGet("new-arrivals")]
    public async Task<IActionResult> GetNewArrivals([FromQuery] int limit = 8)
    {
        try
        {
            var products = await _recommendationService.GetNewArrivalsAsync(limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting new arrivals");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get products with low stock (urgent purchase needed)
    /// </summary>
    [HttpGet("low-stock-urgent")]
    public async Task<IActionResult> GetLowStockUrgent([FromQuery] int limit = 8)
    {
        try
        {
            var products = await _recommendationService.GetLowStockUrgentAsync(limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting low stock products");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get products with biggest discounts
    /// </summary>
    [HttpGet("biggest-discounts")]
    public async Task<IActionResult> GetBiggestDiscounts([FromQuery] int limit = 8)
    {
        try
        {
            var products = await _recommendationService.GetBiggestDiscountsAsync(limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting biggest discounts");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get healthy products (filtered by health tags)
    /// </summary>
    [HttpGet("healthy")]
    public async Task<IActionResult> GetHealthyProducts([FromQuery] int limit = 8)
    {
        try
        {
            var products = await _recommendationService.GetHealthyProductsAsync(limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting healthy products");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
