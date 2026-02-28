using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;
using System.Security.Claims;

namespace FoodCare.API.Controllers.Staff;

/// <summary>
/// Inbound Session controller - "Phiên nhập kho" management.
/// Supports auto-grouping by supplier (SAP/Odoo/Oracle pattern).
/// Staff creates session → adds items → system groups by supplier → complete.
/// </summary>
[ApiController]
[Route("api/staff/inbound-sessions")]
[Authorize(Roles = "staff,admin")]
public class InboundSessionController : ControllerBase
{
    private readonly IInboundSessionService _sessionService;
    private readonly IStaffMemberService _staffMemberService;
    private readonly IWarehouseService _warehouseService;

    public InboundSessionController(
        IInboundSessionService sessionService,
        IStaffMemberService staffMemberService,
        IWarehouseService warehouseService)
    {
        _sessionService = sessionService;
        _staffMemberService = staffMemberService;
        _warehouseService = warehouseService;
    }

    // =====================================================
    // GET: List sessions
    // =====================================================

    /// <summary>
    /// Get inbound sessions — warehouse-scoped for staff, all for admin
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<InboundSessionDto>>> GetSessions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? warehouseId = null,
        [FromQuery] string? status = null)
    {
        if (User.IsInRole("admin"))
        {
            var result = await _sessionService.GetSessionsAsync(page, pageSize, warehouseId, status);
            return Ok(result);
        }

        var effectiveWarehouseId = await ResolveWarehouseIdAsync(warehouseId);
        if (effectiveWarehouseId == null)
            return BadRequest(new { message = "Không có kho được gán" });

        var sessions = await _sessionService.GetSessionsAsync(page, pageSize, effectiveWarehouseId, status);
        return Ok(sessions);
    }

    // =====================================================
    // GET: Session by ID
    // =====================================================

    /// <summary>
    /// Get inbound session by ID with all receipts and details
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<InboundSessionDto>> GetSession(Guid id)
    {
        var session = await _sessionService.GetSessionByIdAsync(id);
        if (session == null) return NotFound();

        // Enforce warehouse access for staff
        if (!User.IsInRole("admin"))
        {
            var staffId = await GetCurrentStaffIdAsync();
            if (staffId == null) return Forbid("Cần hồ sơ nhân viên");

            if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, session.WarehouseId))
                return Forbid("Phiên nhập không thuộc kho của bạn");
        }

        return Ok(session);
    }

    // =====================================================
    // POST: Create session
    // =====================================================

    /// <summary>
    /// Create a new inbound session (Draft)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<InboundSessionDto>> CreateSession(
        [FromBody] CreateInboundSessionRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Cần hồ sơ nhân viên");

        // Verify warehouse access
        if (!User.IsInRole("admin"))
        {
            if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, request.WarehouseId))
                return Forbid("Bạn không có quyền tạo phiên nhập cho kho này");
        }

        try
        {
            var result = await _sessionService.CreateSessionAsync(request, staffId.Value);
            return CreatedAtAction(nameof(GetSession), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // =====================================================
    // POST: Add item (auto-groups by supplier)
    // =====================================================

    /// <summary>
    /// Add a single item to session. System auto-groups by supplier.
    /// </summary>
    [HttpPost("{id}/items")]
    public async Task<ActionResult<InboundSessionDto>> AddItem(
        Guid id, [FromBody] AddInboundItemRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Cần hồ sơ nhân viên");

        if (!await VerifySessionAccess(id, staffId.Value))
            return Forbid("Phiên nhập không thuộc kho của bạn");

        try
        {
            var result = await _sessionService.AddItemAsync(id, request, staffId.Value);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Add multiple items at once (batch). System auto-groups by supplier.
    /// </summary>
    [HttpPost("{id}/items/batch")]
    public async Task<ActionResult<InboundSessionDto>> AddItemsBatch(
        Guid id, [FromBody] AddInboundItemsBatchRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Cần hồ sơ nhân viên");

        if (!await VerifySessionAccess(id, staffId.Value))
            return Forbid("Phiên nhập không thuộc kho của bạn");

        try
        {
            var result = await _sessionService.AddItemsBatchAsync(id, request, staffId.Value);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // =====================================================
    // PUT: Update detail line
    // =====================================================

    /// <summary>
    /// Update a detail line item in the session
    /// </summary>
    [HttpPut("{id}/details/{detailId}")]
    public async Task<ActionResult<InboundSessionDto>> UpdateDetail(
        Guid id, Guid detailId, [FromBody] UpdateInboundDetailRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Cần hồ sơ nhân viên");

        if (!await VerifySessionAccess(id, staffId.Value))
            return Forbid("Phiên nhập không thuộc kho của bạn");

        try
        {
            var result = await _sessionService.UpdateDetailAsync(id, detailId, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // =====================================================
    // DELETE: Remove detail line
    // =====================================================

    /// <summary>
    /// Remove a detail line from the session
    /// </summary>
    [HttpDelete("{id}/details/{detailId}")]
    public async Task<ActionResult<InboundSessionDto>> RemoveDetail(Guid id, Guid detailId)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Cần hồ sơ nhân viên");

        if (!await VerifySessionAccess(id, staffId.Value))
            return Forbid("Phiên nhập không thuộc kho của bạn");

        try
        {
            var result = await _sessionService.RemoveDetailAsync(id, detailId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // =====================================================
    // POST: Complete session
    // =====================================================

    /// <summary>
    /// Complete session — all receipts confirmed, items added to inventory
    /// </summary>
    [HttpPost("{id}/complete")]
    public async Task<ActionResult<InboundSessionDto>> CompleteSession(
        Guid id, [FromBody] CompleteInboundSessionRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Cần hồ sơ nhân viên");

        if (!await VerifySessionAccess(id, staffId.Value))
            return Forbid("Phiên nhập không thuộc kho của bạn");

        try
        {
            var result = await _sessionService.CompleteSessionAsync(id, request, staffId.Value);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // =====================================================
    // POST: Cancel session
    // =====================================================

    /// <summary>
    /// Cancel an inbound session
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<InboundSessionDto>> CancelSession(Guid id)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Cần hồ sơ nhân viên");

        if (!await VerifySessionAccess(id, staffId.Value))
            return Forbid("Phiên nhập không thuộc kho của bạn");

        try
        {
            var result = await _sessionService.CancelSessionAsync(id, staffId.Value);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

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

    private async Task<Guid?> ResolveWarehouseIdAsync(Guid? requestedWarehouseId = null)
    {
        if (User.IsInRole("admin") && requestedWarehouseId.HasValue)
            return requestedWarehouseId;

        var userId = GetCurrentUserId();
        if (userId == null) return null;

        var staff = await _staffMemberService.GetStaffMemberByUserIdAsync(userId.Value);
        return staff?.WarehouseId;
    }

    private async Task<bool> VerifySessionAccess(Guid sessionId, Guid staffId)
    {
        if (User.IsInRole("admin")) return true;

        var session = await _sessionService.GetSessionByIdAsync(sessionId);
        if (session == null) return false;

        return await _warehouseService.StaffHasWarehouseAccessAsync(staffId, session.WarehouseId);
    }
}
