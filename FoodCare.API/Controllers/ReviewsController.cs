using FoodCare.API.Models.DTOs.Reviews;
using FoodCare.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Extensions;
namespace FoodCare.API.Controllers;

[ApiController]
[Route("api")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _service;

    public ReviewsController(IReviewService service)
    {
        _service = service;
    }

    [HttpGet("products/{productId:guid}/reviews")]
    public async Task<IActionResult> GetReviews(Guid productId, [FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        => Ok(await _service.GetReviewsAsync(productId, pageIndex, pageSize));

    [Authorize]
    [HttpGet("products/{productId:guid}/reviews/eligibility")]
    public async Task<IActionResult> Eligibility(Guid productId)
        => Ok(await _service.CheckEligibilityAsync(productId, User.GetUserId()));

    [Authorize]
    [HttpPost("reviews")]
    public async Task<IActionResult> Create(CreateReviewDto dto)
    {
        await _service.CreateReviewAsync(dto, User.GetUserId());
        return Ok();
    }

    [Authorize]
    [HttpPost("reviews/{reviewId:guid}/helpful")]
    public async Task<IActionResult> Helpful(Guid reviewId)
    {
        await _service.MarkHelpfulAsync(reviewId, User.GetUserId());
        return Ok();
    }
}
