using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/finance")]
[Authorize(Roles = "admin")]
public class AdminFinanceController : ControllerBase
{
    private readonly IAdminFinanceService _financeService;
    private readonly ILogger<AdminFinanceController> _logger;

    public AdminFinanceController(
        IAdminFinanceService financeService,
        ILogger<AdminFinanceController> logger)
    {
        _financeService = financeService;
        _logger = logger;
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetSummary([FromQuery] int? month, [FromQuery] int? year)
    {
        try
        {
            var now = DateTime.UtcNow;
            var result = await _financeService.GetSummaryAsync(month ?? now.Month, year ?? now.Year);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving finance summary");
            return StatusCode(500, new { message = "Lỗi khi lấy tổng hợp tài chính" });
        }
    }

    [HttpGet("settlements")]
    public async Task<ActionResult> GetSettlements([FromQuery] int? month, [FromQuery] int? year)
    {
        try
        {
            var now = DateTime.UtcNow;
            var result = await _financeService.GetSettlementsAsync(month ?? now.Month, year ?? now.Year);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving settlements");
            return StatusCode(500, new { message = "Lỗi khi lấy đối soát" });
        }
    }

    [HttpPost("settle-all")]
    public async Task<ActionResult> SettleAll([FromQuery] int? month, [FromQuery] int? year)
    {
        try
        {
            var now = DateTime.UtcNow;
            await _financeService.SettleAllAsync(month ?? now.Month, year ?? now.Year);
            return Ok(new { message = "Đã thanh toán cho tất cả mart thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error settling all");
            return StatusCode(500, new { message = "Lỗi khi thanh toán" });
        }
    }
}
