using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Suppliers;
using FoodCare.API.Services.Interfaces.SupplierModule;
using System.Security.Claims;

namespace FoodCare.API.Controllers.supplier;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "supplier")]
public class SupplierController : ControllerBase
{
    private readonly ISupplierAuthService _supplierAuthService;

    public SupplierController(ISupplierAuthService supplierAuthService)
    {
        _supplierAuthService = supplierAuthService;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<SupplierProfileDto>> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var profile = await _supplierAuthService.GetSupplierProfileAsync(userId);
        if (profile == null)
            return NotFound(new { message = "Supplier profile not found" });

        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<ActionResult<SupplierProfileDto>> UpdateProfile(UpdateSupplierDto updateDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var profile = await _supplierAuthService.UpdateSupplierProfileAsync(userId, updateDto);
        if (profile == null)
            return NotFound(new { message = "Supplier profile not found" });

        return Ok(profile);
    }

    [HttpGet("products")]
    public async Task<ActionResult<IEnumerable<SupplierProductDto>>> GetProducts()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var products = await _supplierAuthService.GetSupplierProductsAsync(userId);
        return Ok(products);
    }

    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<SupplierOrderDto>>> GetOrders()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var orders = await _supplierAuthService.GetSupplierOrdersAsync(userId);
        return Ok(orders);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<SupplierStatsDto>> GetStats()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var stats = await _supplierAuthService.GetSupplierStatsAsync(userId);
        return Ok(stats);
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueDataDto>> GetRevenue([FromQuery] int? months = 6)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var revenue = await _supplierAuthService.GetRevenueDataAsync(userId, months);
        return Ok(revenue);
    }

    [HttpGet("reviews")]
    public async Task<ActionResult<IEnumerable<SupplierReviewDto>>> GetReviews()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var reviews = await _supplierAuthService.GetSupplierReviewsAsync(userId);
        return Ok(reviews);
    }

    [HttpGet("reviews/stats")]
    public async Task<ActionResult<ReviewStatsDto>> GetReviewStats()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var stats = await _supplierAuthService.GetReviewStatsAsync(userId);
        return Ok(stats);
    }

    [HttpPost("reviews/{reviewId}/respond")]
    public async Task<ActionResult> RespondToReview(Guid reviewId, [FromBody] RespondToReviewDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _supplierAuthService.RespondToReviewAsync(userId, reviewId, dto);
        if (!result)
            return NotFound(new { message = "Review not found or you don't have permission to respond" });

        return Ok(new { message = "Response submitted successfully" });
    }

    // ===== PRODUCT CRUD =====

    [HttpPost("products")]
    public async Task<ActionResult<SupplierProductDto>> CreateProduct([FromBody] CreateSupplierProductDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            var product = await _supplierAuthService.CreateProductAsync(userId, dto);
            if (product == null)
                return NotFound(new { message = "Supplier profile not found" });

            return Ok(product);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("products/{productId}")]
    public async Task<ActionResult<SupplierProductDto>> UpdateProduct(Guid productId, [FromBody] UpdateSupplierProductDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            var product = await _supplierAuthService.UpdateProductAsync(userId, productId, dto);
            if (product == null)
                return NotFound(new { message = "Product not found or you don't have permission" });

            return Ok(product);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("products/{productId}")]
    public async Task<ActionResult> DeleteProduct(Guid productId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _supplierAuthService.DeleteProductAsync(userId, productId);
        if (!result)
            return NotFound(new { message = "Product not found or you don't have permission" });

        return Ok(new { message = "Product deleted successfully" });
    }

    [HttpPost("products/{productId}/submit")]
    public async Task<ActionResult> SubmitProductForApproval(Guid productId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _supplierAuthService.SubmitProductForApprovalAsync(userId, productId);
        if (!result)
            return NotFound(new { message = "Product not found" });

        return Ok(new { message = "Product submitted for approval" });
    }

    // ===== BUSINESS REGISTRATION =====

    [HttpGet("registration")]
    public async Task<ActionResult<SupplierRegistrationDto>> GetRegistrationStatus()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var registration = await _supplierAuthService.GetRegistrationStatusAsync(userId);
        if (registration == null)
            return NotFound(new { message = "Supplier profile not found" });

        return Ok(registration);
    }

    [HttpPost("registration")]
    public async Task<ActionResult<SupplierRegistrationDto>> SubmitRegistration([FromBody] SubmitRegistrationDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            var registration = await _supplierAuthService.SubmitRegistrationAsync(userId, dto);
            if (registration == null)
                return NotFound(new { message = "Supplier profile not found" });

            return Ok(registration);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
