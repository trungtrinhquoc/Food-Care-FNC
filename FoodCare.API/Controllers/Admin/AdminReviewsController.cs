using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Reviews;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "admin")]
public class AdminReviewsController : ControllerBase
{
    private readonly IAdminReviewService _reviewService;
    private readonly ILogger<AdminReviewsController> _logger;

    public AdminReviewsController(
        IAdminReviewService reviewService,
        ILogger<AdminReviewsController> logger)
    {
        _reviewService = reviewService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminReviewDto>>> GetReviews([FromQuery] AdminReviewFilterDto filter)
    {
        try
        {
            var result = await _reviewService.GetReviewsAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reviews");
            return StatusCode(500, new { message = "An error occurred while retrieving reviews" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AdminReviewDto>> GetReview(Guid id)
    {
        try
        {
            var review = await _reviewService.GetReviewByIdAsync(id);
            if (review == null)
            {
                return NotFound(new { message = $"Review with ID {id} not found" });
            }

            return Ok(review);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the review" });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ReviewStatsDto>> GetReviewStats([FromQuery] Guid? productId = null)
    {
        try
        {
            var stats = await _reviewService.GetReviewStatsAsync(productId);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving review stats");
            return StatusCode(500, new { message = "An error occurred while retrieving review stats" });
        }
    }

    [HttpPost("{id}/reply")]
    public async Task<ActionResult<AdminReviewDto>> ReplyToReview(Guid id, [FromBody] ReplyReviewDto dto)
    {
        try
        {
            var review = await _reviewService.ReplyToReviewAsync(id, dto);
            if (review == null)
            {
                return NotFound(new { message = $"Review with ID {id} not found" });
            }

            return Ok(review);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error replying to review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred while replying to the review" });
        }
    }

    [HttpPatch("{id}/toggle-hide")]
    public async Task<ActionResult> ToggleHideReview(Guid id)
    {
        try
        {
            var success = await _reviewService.ToggleHideReviewAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Review with ID {id} not found" });
            }

            return Ok(new { message = "Review visibility toggled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling hide for review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred while toggling review visibility" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteReview(Guid id)
    {
        try
        {
            var success = await _reviewService.DeleteReviewAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Review with ID {id} not found" });
            }

            return Ok(new { message = "Review deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the review" });
        }
    }
}
