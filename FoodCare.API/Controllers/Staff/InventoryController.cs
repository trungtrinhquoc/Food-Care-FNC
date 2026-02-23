using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;
using System.Security.Claims;

namespace FoodCare.API.Controllers.Staff;

[ApiController]
[Route("api/staff/inventory")]
[Authorize(Roles = "staff,admin")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IStaffMemberService _staffMemberService;
    private readonly IWarehouseService _warehouseService;

    public InventoryController(
        IInventoryService inventoryService,
        IStaffMemberService staffMemberService,
        IWarehouseService warehouseService)
    {
        _inventoryService = inventoryService;
        _staffMemberService = staffMemberService;
        _warehouseService = warehouseService;
    }

    // =====================================================
    // INVENTORY QUERY ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get inventory with pagination and filters — auto-scoped to staff's warehouse
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<WarehouseInventoryDto>>> GetInventory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? warehouseId = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? inventoryType = null,
        [FromQuery] bool? lowStock = null,
        [FromQuery] bool? nearExpiry = null)
    {
        var effectiveWarehouseId = await ResolveWarehouseIdAsync(warehouseId);
        if (effectiveWarehouseId == null) return Forbid("No warehouse assigned to your account");

        var result = await _inventoryService.GetInventoryAsync(
            page, pageSize, effectiveWarehouseId, productId, inventoryType, lowStock, nearExpiry);
        return Ok(result);
    }

    /// <summary>
    /// Get inventory record by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<WarehouseInventoryDto>> GetInventoryById(Guid id)
    {
        var inventory = await _inventoryService.GetInventoryByIdAsync(id);
        if (inventory == null) return NotFound();
        return Ok(inventory);
    }

    /// <summary>
    /// Get inventory for specific product in staff's warehouse
    /// </summary>
    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<WarehouseInventoryDto>>> GetProductInventory(Guid productId)
    {
        var inventory = await _inventoryService.GetInventoryByProductAsync(productId);
        return Ok(inventory);
    }

    /// <summary>
    /// Get total available quantity for a product — scoped to staff's warehouse
    /// </summary>
    [HttpGet("product/{productId}/available")]
    public async Task<ActionResult<object>> GetProductAvailability(Guid productId, [FromQuery] Guid? warehouseId = null)
    {
        var effectiveWarehouseId = await ResolveWarehouseIdAsync(warehouseId);
        if (effectiveWarehouseId == null) return Forbid("No warehouse assigned to your account");

        var available = await _inventoryService.GetAvailableQuantityAsync(productId, effectiveWarehouseId);
        return Ok(new { productId, warehouseId = effectiveWarehouseId, availableQuantity = available });
    }

    /// <summary>
    /// Get expiring inventory — scoped to staff's warehouse
    /// </summary>
    [HttpGet("expiring")]
    public async Task<ActionResult<IEnumerable<WarehouseInventoryDto>>> GetExpiringInventory(
        [FromQuery] int days = 30,
        [FromQuery] Guid? warehouseId = null)
    {
        var effectiveWarehouseId = await ResolveWarehouseIdAsync(warehouseId);
        if (effectiveWarehouseId == null) return Forbid("No warehouse assigned to your account");

        var inventory = await _inventoryService.GetExpiringInventoryAsync(days, effectiveWarehouseId);
        return Ok(inventory);
    }

    /// <summary>
    /// Get low stock inventory — scoped to staff's warehouse
    /// </summary>
    [HttpGet("low-stock")]
    public async Task<ActionResult<IEnumerable<WarehouseInventoryDto>>> GetLowStockInventory([FromQuery] Guid? warehouseId = null)
    {
        var effectiveWarehouseId = await ResolveWarehouseIdAsync(warehouseId);
        if (effectiveWarehouseId == null) return Forbid("No warehouse assigned to your account");

        var inventory = await _inventoryService.GetLowStockInventoryAsync(effectiveWarehouseId);
        return Ok(inventory);
    }

    // =====================================================
    // INVENTORY ADJUSTMENT ENDPOINTS
    // =====================================================

    /// <summary>
    /// Adjust inventory quantity (requires permission)
    /// </summary>
    [HttpPost("{id}/adjust")]
    public async Task<ActionResult<WarehouseInventoryDto>> AdjustInventory(Guid id, [FromBody] AdjustInventoryRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var hasPermission = await _staffMemberService.HasPermissionAsync(staffId.Value, "can_adjust_inventory");
        if (!hasPermission) return Forbid("Inventory adjustment permission required");

        try
        {
            var inventory = await _inventoryService.AdjustInventoryAsync(id, request, staffId.Value);
            if (inventory == null) return NotFound();
            return Ok(inventory);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Transfer inventory between warehouses
    /// </summary>
    [HttpPost("transfer")]
    public async Task<IActionResult> TransferInventory([FromBody] TransferInventoryRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var hasPermission = await _staffMemberService.HasPermissionAsync(staffId.Value, "can_adjust_inventory");
        if (!hasPermission) return Forbid("Inventory adjustment permission required");

        try
        {
            await _inventoryService.TransferInventoryAsync(request, staffId.Value);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Move inventory to quarantine
    /// </summary>
    [HttpPost("{id}/quarantine")]
    public async Task<ActionResult<WarehouseInventoryDto>> QuarantineInventory(Guid id, [FromBody] QuarantineInventoryRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        try
        {
            var inventory = await _inventoryService.QuarantineInventoryAsync(id, request, staffId.Value);
            if (inventory == null) return NotFound();
            return Ok(inventory);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Mark inventory as expired
    /// </summary>
    [HttpPost("{id}/mark-expired")]
    public async Task<ActionResult<WarehouseInventoryDto>> MarkExpired(Guid id, [FromBody] MarkExpiredRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        try
        {
            var inventory = await _inventoryService.MarkExpiredAsync(id, request, staffId.Value);
            if (inventory == null) return NotFound();
            return Ok(inventory);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // =====================================================
    // STOCK MOVEMENT ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get stock movements with filters
    /// </summary>
    [HttpGet("movements")]
    public async Task<ActionResult<PagedResponse<StockMovementDto>>> GetMovements(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? inventoryId = null,
        [FromQuery] string? movementType = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var result = await _inventoryService.GetMovementsAsync(page, pageSize, inventoryId, movementType, from, to);
        return Ok(result);
    }

    /// <summary>
    /// Get movements for specific inventory record
    /// </summary>
    [HttpGet("{id}/movements")]
    public async Task<ActionResult<IEnumerable<StockMovementDto>>> GetInventoryMovements(Guid id)
    {
        var movements = await _inventoryService.GetMovementsByInventoryIdAsync(id);
        return Ok(movements);
    }

    // =====================================================
    // RESERVATION ENDPOINTS
    // =====================================================

    /// <summary>
    /// Reserve inventory for an order
    /// </summary>
    [HttpPost("reserve")]
    public async Task<ActionResult<StockReservationDto>> ReserveStock([FromBody] ReserveStockRequest request)
    {
        try
        {
            var reservation = await _inventoryService.ReserveStockAsync(request);
            return Ok(reservation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Release reservation
    /// </summary>
    [HttpPost("reservations/{id}/release")]
    public async Task<IActionResult> ReleaseReservation(Guid id)
    {
        var result = await _inventoryService.ReleaseReservationAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    /// <summary>
    /// Confirm reservation (convert to actual deduction)
    /// </summary>
    [HttpPost("reservations/{id}/confirm")]
    public async Task<IActionResult> ConfirmReservation(Guid id)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        try
        {
            await _inventoryService.ConfirmReservationAsync(id, staffId.Value);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get active reservations for an order
    /// </summary>
    [HttpGet("reservations/order/{orderId}")]
    public async Task<ActionResult<IEnumerable<StockReservationDto>>> GetOrderReservations(Guid orderId)
    {
        var reservations = await _inventoryService.GetReservationsByOrderAsync(orderId);
        return Ok(reservations);
    }

    // =====================================================
    // FIFO PICKING ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get FIFO pick list for products (for order fulfillment)
    /// </summary>
    [HttpPost("pick-list")]
    public async Task<ActionResult<IEnumerable<FifoPickDto>>> GetFifoPickList([FromBody] PickListRequest request)
    {
        try
        {
            var pickList = await _inventoryService.GetFifoPickListAsync(request);
            return Ok(pickList);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Execute FIFO pick (deduct inventory)
    /// </summary>
    [HttpPost("pick")]
    public async Task<IActionResult> ExecuteFifoPick([FromBody] ExecutePickRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var canOverride = await _staffMemberService.HasPermissionAsync(staffId.Value, "can_override_fifo");

        try
        {
            await _inventoryService.ExecuteFifoPickAsync(request, staffId.Value, canOverride);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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

    /// <summary>
    /// Resolve the effective warehouse ID for the current staff member.
    /// Admin can pass any warehouseId; staff always gets their assigned warehouse.
    /// </summary>
    private async Task<Guid?> ResolveWarehouseIdAsync(Guid? requestedWarehouseId = null)
    {
        // Admin can access any warehouse
        if (User.IsInRole("admin") && requestedWarehouseId.HasValue)
            return requestedWarehouseId;

        var userId = GetCurrentUserId();
        if (userId == null) return null;

        var staff = await _staffMemberService.GetStaffMemberByUserIdAsync(userId.Value);
        return staff?.WarehouseId;
    }
}
