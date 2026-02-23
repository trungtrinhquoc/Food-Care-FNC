using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;
using System.Security.Claims;

namespace FoodCare.API.Controllers.Staff;

[ApiController]
[Route("api/staff/returns")]
[Authorize(Roles = "staff,admin")]
public class ReturnController : ControllerBase
{
    private readonly IReturnService _returnService;
    private readonly IStaffMemberService _staffMemberService;
    private readonly IWarehouseService _warehouseService;

    public ReturnController(
        IReturnService returnService,
        IStaffMemberService staffMemberService,
        IWarehouseService warehouseService)
    {
        _returnService = returnService;
        _staffMemberService = staffMemberService;
        _warehouseService = warehouseService;
    }

    /// <summary>
    /// Get all return shipments — auto-scoped to staff's warehouse
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<ReturnShipmentDto>>> GetReturns(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? supplierId = null,
        [FromQuery] string? status = null)
    {
        var warehouseId = await ResolveWarehouseIdAsync();
        if (warehouseId == null && !User.IsInRole("admin")) return Forbid("No warehouse assigned to your account");

        var result = await _returnService.GetReturnsAsync(page, pageSize, supplierId, status, warehouseId);
        return Ok(result);
    }

    /// <summary>
    /// Get return shipment by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ReturnShipmentDto>> GetReturn(Guid id)
    {
        var returnShipment = await _returnService.GetReturnByIdAsync(id);
        if (returnShipment == null) return NotFound();
        return Ok(returnShipment);
    }

    /// <summary>
    /// Get returns for a specific discrepancy report
    /// </summary>
    [HttpGet("by-discrepancy/{discrepancyId}")]
    public async Task<ActionResult<IEnumerable<ReturnShipmentDto>>> GetReturnsByDiscrepancy(Guid discrepancyId)
    {
        var returns = await _returnService.GetReturnsByDiscrepancyAsync(discrepancyId);
        return Ok(returns);
    }

    /// <summary>
    /// Create new return shipment
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReturnShipmentDto>> CreateReturn([FromBody] CreateReturnShipmentRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        try
        {
            var returnShipment = await _returnService.CreateReturnAsync(request, staffId.Value);
            return CreatedAtAction(nameof(GetReturn), new { id = returnShipment.Id }, returnShipment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Add item to return shipment
    /// </summary>
    [HttpPost("{id}/items")]
    public async Task<ActionResult<ReturnShipmentDto>> AddReturnItem(Guid id, [FromBody] AddReturnItemRequest request)
    {
        try
        {
            var returnShipment = await _returnService.AddReturnItemAsync(id, request);
            if (returnShipment == null) return NotFound();
            return Ok(returnShipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update return item
    /// </summary>
    [HttpPut("{id}/items/{itemId}")]
    public async Task<ActionResult<ReturnShipmentDto>> UpdateReturnItem(
        Guid id, 
        Guid itemId, 
        [FromBody] UpdateReturnItemRequest request)
    {
        try
        {
            var returnShipment = await _returnService.UpdateReturnItemAsync(id, itemId, request);
            if (returnShipment == null) return NotFound();
            return Ok(returnShipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Remove item from return shipment
    /// </summary>
    [HttpDelete("{id}/items/{itemId}")]
    public async Task<ActionResult<ReturnShipmentDto>> RemoveReturnItem(Guid id, Guid itemId)
    {
        try
        {
            var returnShipment = await _returnService.RemoveReturnItemAsync(id, itemId);
            if (returnShipment == null) return NotFound();
            return Ok(returnShipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Submit return shipment for dispatch
    /// </summary>
    [HttpPost("{id}/submit")]
    public async Task<ActionResult<ReturnShipmentDto>> SubmitReturn(Guid id)
    {
        try
        {
            var returnShipment = await _returnService.SubmitReturnAsync(id);
            if (returnShipment == null) return NotFound();
            return Ok(returnShipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Mark return as dispatched
    /// </summary>
    [HttpPost("{id}/dispatch")]
    public async Task<ActionResult<ReturnShipmentDto>> DispatchReturn(Guid id, [FromBody] DispatchReturnRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        try
        {
            var returnShipment = await _returnService.DispatchReturnAsync(id, request, staffId.Value);
            if (returnShipment == null) return NotFound();
            return Ok(returnShipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Confirm return received by supplier
    /// </summary>
    [HttpPost("{id}/confirm-received")]
    public async Task<ActionResult<ReturnShipmentDto>> ConfirmReceived(Guid id, [FromBody] ConfirmReturnReceivedRequest request)
    {
        try
        {
            var returnShipment = await _returnService.ConfirmReceivedAsync(id, request);
            if (returnShipment == null) return NotFound();
            return Ok(returnShipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Record credit issued for return
    /// </summary>
    [HttpPost("{id}/credit")]
    public async Task<ActionResult<ReturnShipmentDto>> RecordCredit(Guid id, [FromBody] RecordCreditRequest request)
    {
        try
        {
            var returnShipment = await _returnService.RecordCreditAsync(id, request);
            if (returnShipment == null) return NotFound();
            return Ok(returnShipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Close return shipment
    /// </summary>
    [HttpPost("{id}/close")]
    public async Task<ActionResult<ReturnShipmentDto>> CloseReturn(Guid id)
    {
        try
        {
            var returnShipment = await _returnService.CloseReturnAsync(id);
            if (returnShipment == null) return NotFound();
            return Ok(returnShipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cancel return shipment
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<ReturnShipmentDto>> CancelReturn(Guid id, [FromBody] CancelReturnRequest request)
    {
        try
        {
            var returnShipment = await _returnService.CancelReturnAsync(id, request);
            if (returnShipment == null) return NotFound();
            return Ok(returnShipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get return statistics for dashboard — scoped to staff's warehouse
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetReturnStats([FromQuery] Guid? supplierId = null)
    {
        var warehouseId = await ResolveWarehouseIdAsync();
        if (warehouseId == null && !User.IsInRole("admin")) return Forbid("No warehouse assigned to your account");

        var stats = await _returnService.GetReturnStatsAsync(supplierId, warehouseId);
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
