using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/stats")]
[Authorize(Roles = "admin")]
public class AdminStatsController : ControllerBase
{
    private readonly IAdminStatsService _statsService;
    private readonly ILogger<AdminStatsController> _logger;

    public AdminStatsController(
        IAdminStatsService statsService,
        ILogger<AdminStatsController> logger)
    {
        _statsService = statsService;
        _logger = logger;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult> GetDashboardStats()
    {
        try
        {
            var stats = await _statsService.GetDashboardStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard stats");
            return StatusCode(500, new { message = "An error occurred while retrieving dashboard stats" });
        }
    }

    [HttpGet("revenue")]
    public async Task<ActionResult> GetRevenueData([FromQuery] int months = 6)
    {
        try
        {
            var revenueData = await _statsService.GetRevenueDataAsync(months);
            return Ok(revenueData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving revenue data");
            return StatusCode(500, new { message = "An error occurred while retrieving revenue data" });
        }
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetDashboardSummary()
    {
        try
        {
            var summary = await _statsService.GetDashboardSummaryAsync();
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard summary");
            return StatusCode(500, new { message = "An error occurred while retrieving dashboard summary" });
        }
    }
}
