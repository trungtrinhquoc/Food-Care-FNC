using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;
using System.Security.Claims;

namespace FoodCare.API.Controllers.Staff;

[ApiController]
[Route("api/staff/discrepancies")]
[Authorize(Roles = "staff,admin")]
public class DiscrepancyController : ControllerBase
{
    private readonly IDiscrepancyService _discrepancyService;
    private readonly IStaffMemberService _staffMemberService;
    private readonly IWarehouseService _warehouseService;

    public DiscrepancyController(
        IDiscrepancyService discrepancyService,
        IStaffMemberService staffMemberService,
        IWarehouseService warehouseService)
    {
        _discrepancyService = discrepancyService;
        _staffMemberService = staffMemberService;
        _warehouseService = warehouseService;
    }

    /// <summary>
    /// Get all discrepancy reports — auto-scoped to staff's warehouse
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<DiscrepancyReportDto>>> GetDiscrepancies(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? receiptId = null,
        [FromQuery] string? status = null)
    {
        var warehouseId = await ResolveWarehouseIdAsync();
        if (warehouseId == null) return Forbid("No warehouse assigned to your account");

        var result = await _discrepancyService.GetDiscrepanciesAsync(page, pageSize, receiptId, status, warehouseId);
        return Ok(result);
    }

    /// <summary>
    /// Get discrepancy report by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DiscrepancyReportDto>> GetDiscrepancy(Guid id)
    {
        var discrepancy = await _discrepancyService.GetDiscrepancyByIdAsync(id);
        if (discrepancy == null) return NotFound();
        return Ok(discrepancy);
    }

    /// <summary>
    /// Get discrepancies for a specific receipt
    /// </summary>
    [HttpGet("by-receipt/{receiptId}")]
    public async Task<ActionResult<IEnumerable<DiscrepancyReportDto>>> GetDiscrepanciesByReceipt(Guid receiptId)
    {
        var discrepancies = await _discrepancyService.GetDiscrepanciesByReceiptAsync(receiptId);
        return Ok(discrepancies);
    }

    /// <summary>
    /// Create new discrepancy report
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DiscrepancyReportDto>> CreateDiscrepancy([FromBody] CreateDiscrepancyReportRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        try
        {
            var discrepancy = await _discrepancyService.CreateDiscrepancyAsync(request, staffId.Value);
            return CreatedAtAction(nameof(GetDiscrepancy), new { id = discrepancy.Id }, discrepancy);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Add item to discrepancy report
    /// </summary>
    [HttpPost("{id}/items")]
    public async Task<ActionResult<DiscrepancyReportDto>> AddDiscrepancyItem(Guid id, [FromBody] AddDiscrepancyItemRequest request)
    {
        try
        {
            var discrepancy = await _discrepancyService.AddDiscrepancyItemAsync(id, request);
            if (discrepancy == null) return NotFound();
            return Ok(discrepancy);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update discrepancy item
    /// </summary>
    [HttpPut("{id}/items/{itemId}")]
    public async Task<ActionResult<DiscrepancyReportDto>> UpdateDiscrepancyItem(
        Guid id, 
        Guid itemId, 
        [FromBody] UpdateDiscrepancyItemRequest request)
    {
        try
        {
            var discrepancy = await _discrepancyService.UpdateDiscrepancyItemAsync(id, itemId, request);
            if (discrepancy == null) return NotFound();
            return Ok(discrepancy);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Submit discrepancy report for review
    /// </summary>
    [HttpPost("{id}/submit")]
    public async Task<ActionResult<DiscrepancyReportDto>> SubmitDiscrepancy(Guid id)
    {
        try
        {
            var discrepancy = await _discrepancyService.SubmitDiscrepancyAsync(id);
            if (discrepancy == null) return NotFound();
            return Ok(discrepancy);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Approve discrepancy report (Admin only)
    /// </summary>
    [HttpPost("{id}/approve")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<DiscrepancyReportDto>> ApproveDiscrepancy(Guid id, [FromBody] ApproveDiscrepancyRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        try
        {
            var discrepancy = await _discrepancyService.ApproveDiscrepancyAsync(id, request, staffId.Value);
            if (discrepancy == null) return NotFound();
            return Ok(discrepancy);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Reject discrepancy report
    /// </summary>
    [HttpPost("{id}/reject")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<DiscrepancyReportDto>> RejectDiscrepancy(Guid id, [FromBody] RejectDiscrepancyRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        try
        {
            var discrepancy = await _discrepancyService.RejectDiscrepancyAsync(id, request, staffId.Value);
            if (discrepancy == null) return NotFound();
            return Ok(discrepancy);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Mark discrepancy as resolved
    /// </summary>
    [HttpPost("{id}/resolve")]
    public async Task<ActionResult<DiscrepancyReportDto>> ResolveDiscrepancy(Guid id, [FromBody] ResolveDiscrepancyRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        try
        {
            var discrepancy = await _discrepancyService.ResolveDiscrepancyAsync(id, request, staffId.Value);
            if (discrepancy == null) return NotFound();
            return Ok(discrepancy);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get pending discrepancies count for dashboard — scoped to staff's warehouse
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetDiscrepancyStats()
    {
        var warehouseId = await ResolveWarehouseIdAsync();
        if (warehouseId == null) return Forbid("No warehouse assigned to your account");

        var stats = await _discrepancyService.GetDiscrepancyStatsAsync(warehouseId);
        return Ok(stats);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private async Task<Guid?> GetCurrentStaffIdAsync()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return null;

        var staff = await _staffMemberService.GetStaffMemberByUserIdAsync(userId.Value);
        return staff?.Id;
    }

    private async Task<Guid?> ResolveWarehouseIdAsync()
    {
        if (User.IsInRole("admin")) return null; // Admin sees all

        var userId = GetCurrentUserId();
        if (userId == null) return null;

        var staff = await _staffMemberService.GetStaffMemberByUserIdAsync(userId.Value);
        return staff?.WarehouseId;
    }
}
