using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;
using System.Security.Claims;

namespace FoodCare.API.Controllers.Staff;

/// <summary>
/// Staff-facing shipment controller.
/// All endpoints enforce warehouse-level authorization:
/// Staff can ONLY see/manage shipments belonging to their single assigned warehouse.
/// </summary>
[ApiController]
[Route("api/staff/shipments")]
[Authorize(Roles = "staff,admin")]
public class StaffShipmentController : ControllerBase
{
    private readonly IShipmentService _shipmentService;
    private readonly IStaffMemberService _staffMemberService;
    private readonly IWarehouseService _warehouseService;

    public StaffShipmentController(
        IShipmentService shipmentService,
        IStaffMemberService staffMemberService,
        IWarehouseService warehouseService)
    {
        _shipmentService = shipmentService;
        _staffMemberService = staffMemberService;
        _warehouseService = warehouseService;
    }

    /// <summary>
    /// Get all shipments for the staff's assigned warehouse
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<SupplierShipmentDto>>> GetShipments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] Guid? warehouseId = null,
        [FromQuery] string? searchTerm = null)
    {
        var effectiveWarehouseId = await ResolveWarehouseIdAsync(warehouseId);
        if (effectiveWarehouseId == null) return Forbid("No warehouse assigned to your account");

        var queryParams = new ShipmentQueryParams
        {
            Page = page,
            PageSize = pageSize,
            Status = status,
            WarehouseId = effectiveWarehouseId.Value,
            SearchTerm = searchTerm,
            SortDescending = true
        };

        var shipments = await _shipmentService.GetShipmentsAsync(queryParams);
        return Ok(shipments);
    }

    /// <summary>
    /// Get shipment by ID (must belong to staff's warehouse)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SupplierShipmentDto>> GetShipment(Guid id)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var shipment = await _shipmentService.GetShipmentByIdAsync(id);
        if (shipment == null) return NotFound();

        // Enforce warehouse access
        if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, shipment.WarehouseId))
            return Forbid("Shipment does not belong to your assigned warehouse");

        return Ok(shipment);
    }

    /// <summary>
    /// Confirm received shipment at warehouse (Delivering → Received)
    /// </summary>
    [HttpPost("{id}/mark-arrived")]
    public async Task<ActionResult<SupplierShipmentDto>> MarkArrived(Guid id, [FromBody] ConfirmReceivedRequest? request = null)
    {
        var (staffId, userId) = await GetCurrentStaffAndUserIdAsync();
        if (staffId == null || userId == null) return Forbid("Staff profile required");

        var shipment = await _shipmentService.GetShipmentByIdAsync(id);
        if (shipment == null) return NotFound();

        // Enforce warehouse access
        if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, shipment.WarehouseId))
            return Forbid("Shipment does not belong to your assigned warehouse");

        try
        {
            var confirmRequest = request ?? new ConfirmReceivedRequest { Notes = "Shipment received at warehouse" };
            var result = await _shipmentService.ConfirmReceivedAsync(id, confirmRequest);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Confirm arrival and receive (alias for backward compatibility)
    /// </summary>
    [HttpPost("{id}/confirm-arrival")]
    public async Task<ActionResult<SupplierShipmentDto>> ConfirmArrival(Guid id, [FromBody] ConfirmReceivedRequest? request = null)
    {
        return await MarkArrived(id, request);
    }

    /// <summary>
    /// Get shipment items
    /// </summary>
    [HttpGet("{id}/items")]
    public async Task<ActionResult<List<ShipmentItemDto>>> GetShipmentItems(Guid id)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var shipment = await _shipmentService.GetShipmentByIdAsync(id);
        if (shipment == null) return NotFound();

        // Enforce warehouse access
        if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, shipment.WarehouseId))
            return Forbid("Shipment does not belong to your assigned warehouse");

        var items = await _shipmentService.GetShipmentItemsAsync(id);
        return Ok(items);
    }

    /// <summary>
    /// Get shipment documents (for verifying biên lai / chứng từ)
    /// </summary>
    [HttpGet("{id}/documents")]
    public async Task<ActionResult<List<ShipmentDocumentDto>>> GetShipmentDocuments(Guid id)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var shipment = await _shipmentService.GetShipmentByIdAsync(id);
        if (shipment == null) return NotFound();

        // Enforce warehouse access
        if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, shipment.WarehouseId))
            return Forbid("Shipment does not belong to your assigned warehouse");

        var documents = await _shipmentService.GetDocumentsAsync(id);
        return Ok(documents);
    }

    /// <summary>
    /// Get shipment status history
    /// </summary>
    [HttpGet("{id}/history")]
    public async Task<ActionResult<List<ShipmentStatusHistoryDto>>> GetShipmentHistory(Guid id)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var shipment = await _shipmentService.GetShipmentByIdAsync(id);
        if (shipment == null) return NotFound();

        // Enforce warehouse access
        if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, shipment.WarehouseId))
            return Forbid("Shipment does not belong to your assigned warehouse");

        var history = await _shipmentService.GetStatusHistoryAsync(id);
        return Ok(history);
    }

    /// <summary>
    /// Get shipment statistics for staff's warehouse
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetStats()
    {
        var effectiveWarehouseId = await ResolveWarehouseIdAsync();
        if (effectiveWarehouseId == null)
            return Ok(new { total = 0, draft = 0, dispatched = 0, inTransit = 0, arrived = 0, inspected = 0, stored = 0 });

        var queryParams = new ShipmentQueryParams 
        { 
            Page = 1, 
            PageSize = 10000,
            WarehouseId = effectiveWarehouseId.Value
        };
        var result = await _shipmentService.GetShipmentsAsync(queryParams);
        var allShipments = result.Items;

        return Ok(new
        {
            total = allShipments.Count,
            preparing = allShipments.Count(s => s.Status.Equals("Preparing", StringComparison.OrdinalIgnoreCase)),
            delivering = allShipments.Count(s => s.Status.Equals("Delivering", StringComparison.OrdinalIgnoreCase)),
            received = allShipments.Count(s => s.Status.Equals("Received", StringComparison.OrdinalIgnoreCase)),
            success = allShipments.Count(s => s.Status.Equals("Success", StringComparison.OrdinalIgnoreCase)),
            cancelled = allShipments.Count(s => s.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        });
    }

    // ===== Helper methods =====

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

    private async Task<(Guid? StaffId, Guid? UserId)> GetCurrentStaffAndUserIdAsync()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return (null, null);

        var staff = await _staffMemberService.GetStaffMemberByUserIdAsync(userId.Value);
        return (staff?.Id, userId);
    }

    /// <summary>
    /// Resolve the effective warehouse ID for the current staff member.
    /// Admin can pass any warehouseId; staff always gets their assigned warehouse.
    /// </summary>
    private async Task<Guid?> ResolveWarehouseIdAsync(Guid? requestedWarehouseId = null)
    {
        if (User.IsInRole("admin") && requestedWarehouseId.HasValue)
            return requestedWarehouseId;

        var userId = GetCurrentUserId();
        if (userId == null) return null;

        var staff = await _staffMemberService.GetStaffMemberByUserIdAsync(userId.Value);
        return staff?.WarehouseId;
    }
}
