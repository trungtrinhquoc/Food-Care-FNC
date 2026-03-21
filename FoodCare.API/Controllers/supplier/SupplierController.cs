using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Suppliers;
using FoodCare.API.Services.Interfaces.SupplierModule;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Controllers.supplier;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "supplier")]
public class SupplierController : ControllerBase
{
    private readonly ISupplierAuthService _supplierAuthService;
    private readonly FoodCareDbContext _context;
    private readonly ILogger<SupplierController> _logger;

    public SupplierController(ISupplierAuthService supplierAuthService, FoodCareDbContext context, ILogger<SupplierController> logger)
    {
        _supplierAuthService = supplierAuthService;
        _context = context;
        _logger = logger;
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

    // ===== ORDER STATUS UPDATE =====

    [HttpPatch("orders/{orderId}/status")]
    public async Task<IActionResult> UpdateOrderStatus(Guid orderId, [FromBody] UpdateOrderStatusDto dto)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();
        try
        {
            var success = await _supplierAuthService.UpdateOrderStatusAsync(orderId, userId, dto);
            if (!success) return NotFound(new { message = "Order not found or access denied." });
            return Ok(new { message = "Order status updated successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/supplier/products/near-expiry?days=45
    [HttpGet("products/near-expiry")]
    public async Task<IActionResult> GetNearExpiryProducts([FromQuery] int days = 45)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();
        var products = await _supplierAuthService.GetNearExpiryProductsAsync(userId, days);
        return Ok(products);
    }

    // GET /api/supplier/sla
    [HttpGet("sla")]
    public async Task<IActionResult> GetSlaMetrics()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();
        var sla = await _supplierAuthService.GetSlaMetricsAsync(userId);
        return Ok(sla);
    }

    // GET /api/supplier/delivery-batches — group confirmed/shipping orders by district
    [HttpGet("delivery-batches")]
    public async Task<IActionResult> GetDeliveryBatches()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();
        var batches = await _supplierAuthService.GetDeliveryBatchesAsync(userId);
        return Ok(batches);
    }

    // ===== BLIND BOX =====

    // POST /api/supplier/blind-boxes  — supplier submits a blind box for admin approval
    [HttpPost("blind-boxes")]
    public async Task<IActionResult> CreateBlindBox([FromBody] CreateSupplierBlindBoxDto dto)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        try
        {
            // Resolve supplierId from userId
            var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == userId);
            if (supplier == null)
                return NotFound(new { message = "Supplier profile not found" });

            var blindBox = new BlindBox
            {
                Id = Guid.NewGuid(),
                SupplierId = supplier.Id,
                Title = dto.Title,
                Description = dto.Description ?? string.Empty,
                OriginalValue = dto.OriginalValue,
                BlindBoxPrice = dto.BlindBoxPrice,
                Quantity = dto.Quantity,
                QuantitySold = 0,
                ExpiryDate = dto.ExpiryDate,
                Contents = dto.Contents,
                ImageUrl = dto.ImageUrl,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.BlindBoxes.Add(blindBox);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = blindBox.Id,
                message = "Blind Box đã được gửi để phê duyệt. Admin sẽ xem xét và phản hồi sớm."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating blind box for supplier {UserId}", userId);
            return StatusCode(500, new { message = "Lỗi khi tạo Blind Box" });
        }
    }

    // GET /api/supplier/blind-boxes  — list this supplier's blind boxes
    [HttpGet("blind-boxes")]
    public async Task<IActionResult> GetMyBlindBoxes()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        try
        {
            var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == userId);
            if (supplier == null) return NotFound(new { message = "Supplier not found" });

            var now = DateTime.UtcNow;
            var boxes = await _context.BlindBoxes
                .Where(b => b.SupplierId == supplier.Id)
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new
                {
                    b.Id,
                    b.Title,
                    b.OriginalValue,
                    b.BlindBoxPrice,
                    b.Quantity,
                    b.QuantitySold,
                    QuantityAvailable = b.Quantity - b.QuantitySold,
                    b.ExpiryDate,
                    b.Status,
                    b.RejectionReason,
                    b.CreatedAt,
                    DaysUntilExpiry = (int)(b.ExpiryDate - now).TotalDays,
                })
                .ToListAsync();

            return Ok(boxes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching blind boxes for supplier");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách Blind Box" });
        }
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
