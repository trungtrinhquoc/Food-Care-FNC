using System.Security.Claims;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

/// <summary>
/// Manages commission policies and provides per-order commission reporting.
/// All endpoints require the <c>admin</c> role.
/// </summary>
[ApiController]
[Route("api/admin/commission")]
[Authorize(Roles = "admin")]
public class AdminCommissionController(
    ICommissionService commissionService,
    ILogger<AdminCommissionController> logger) : ControllerBase
{
    // ── Policy endpoints ──────────────────────────────────────────────────────

    /// <summary>Returns all commission policies (global + per-supplier).</summary>
    [HttpGet("policies")]
    public async Task<ActionResult<List<CommissionPolicyDto>>> GetPolicies()
    {
        try
        {
            var result = await commissionService.GetPoliciesAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving commission policies");
            return Ok(new List<CommissionPolicyDto>());
        }
    }

    /// <summary>Returns the effective commission policy for a specific supplier.</summary>
    [HttpGet("policies/supplier/{supplierId:int}")]
    public async Task<ActionResult<CommissionPolicyDto>> GetEffectivePolicy(int supplierId)
    {
        try
        {
            var result = await commissionService.GetEffectivePolicyAsync(supplierId);
            if (result is null)
                return NotFound(new { message = $"Không tìm thấy chính sách hoa hồng cho supplier {supplierId}" });
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving effective policy for supplier {SupplierId}", supplierId);
            return StatusCode(500, new { message = "Lỗi khi lấy chính sách hoa hồng" });
        }
    }

    /// <summary>
    /// Sets the global platform-wide default commission rate.
    /// Rate must be between 0 and 100 (business standard: 8–15%).
    /// </summary>
    [HttpPut("policies/default")]
    public async Task<ActionResult<CommissionPolicyDto>> SetDefaultRate([FromBody] SetCommissionRateRequest request)
    {
        if (request.Rate < 0 || request.Rate > 100)
            return BadRequest(new { message = "Tỷ lệ hoa hồng phải nằm trong khoảng 0–100%" });

        try
        {
            var adminId = GetAdminId();
            var result  = await commissionService.UpsertGlobalDefaultAsync(request, adminId);
            return Ok(result);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error setting global commission rate");
            return StatusCode(500, new { message = "Lỗi khi cập nhật tỷ lệ hoa hồng mặc định" });
        }
    }

    /// <summary>
    /// Sets a supplier-specific commission rate override.
    /// Deactivates any previous override for the same supplier.
    /// </summary>
    [HttpPut("policies/supplier/{supplierId:int}")]
    public async Task<ActionResult<CommissionPolicyDto>> SetSupplierRate(
        int supplierId, [FromBody] SetCommissionRateRequest request)
    {
        if (request.Rate < 0 || request.Rate > 100)
            return BadRequest(new { message = "Tỷ lệ hoa hồng phải nằm trong khoảng 0–100%" });

        try
        {
            var adminId = GetAdminId();
            var result  = await commissionService.UpsertSupplierPolicyAsync(supplierId, request, adminId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error setting supplier {SupplierId} commission rate", supplierId);
            return StatusCode(500, new { message = "Lỗi khi cập nhật tỷ lệ hoa hồng của supplier" });
        }
    }

    /// <summary>Soft-deactivates a specific commission policy by its ID.</summary>
    [HttpDelete("policies/{policyId:int}")]
    public async Task<ActionResult> DeactivatePolicy(int policyId)
    {
        try
        {
            var deleted = await commissionService.DeactivatePolicyAsync(policyId);
            if (!deleted)
                return NotFound(new { message = $"Không tìm thấy chính sách hoa hồng với ID {policyId}" });

            return Ok(new { message = "Đã vô hiệu hóa chính sách hoa hồng thành công" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deactivating commission policy {PolicyId}", policyId);
            return StatusCode(500, new { message = "Lỗi khi vô hiệu hóa chính sách hoa hồng" });
        }
    }

    // ── Reporting endpoints ───────────────────────────────────────────────────

    /// <summary>
    /// Returns a paged list of per-order commission records.
    /// Filterable by supplier, month, year, and status (pending/settled/refunded).
    /// </summary>
    [HttpGet("orders")]
    public async Task<ActionResult<PagedResult<OrderCommissionDto>>> GetOrderCommissions(
        [FromQuery] int? supplierId,
        [FromQuery] int? month,
        [FromQuery] int? year,
        [FromQuery] string? status,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page     < 1) page     = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        try
        {
            var result = await commissionService.GetOrderCommissionsAsync(
                supplierId, month, year, status, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving order commissions");
            return Ok(new PagedResult<OrderCommissionDto>
            {
                Items = [],
                TotalItems = 0,
                Page = page,
                PageSize = pageSize,
                TotalPages = 0,
            });
        }
    }

    /// <summary>
    /// Returns an aggregated commission report for a given month/year period.
    /// Defaults to the current month if omitted.
    /// </summary>
    [HttpGet("report")]
    public async Task<ActionResult<CommissionReportDto>> GetCommissionReport(
        [FromQuery] int? month,
        [FromQuery] int? year)
    {
        try
        {
            var result = await commissionService.GetCommissionReportAsync(month, year);
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error generating commission report");
            var now = DateTime.UtcNow;
            return Ok(new CommissionReportDto
            {
                Month = month ?? now.Month,
                Year = year ?? now.Year,
                TotalOrderAmount = 0,
                TotalCommissionAmount = 0,
                TotalSupplierAmount = 0,
                TotalOrderCount = 0,
                PendingCount = 0,
                SettledCount = 0,
                RefundedCount = 0,
                BySupplier = []
            });
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Guid GetAdminId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? User.FindFirstValue("sub")
                    ?? throw new UnauthorizedAccessException("Admin identity not found in token.");
        return Guid.Parse(claim);
    }
}
