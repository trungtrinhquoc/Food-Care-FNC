using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;
using System.Security.Claims;

namespace FoodCare.API.Controllers.Staff;

/// <summary>
/// Receipt controller with strict warehouse-level authorization.
/// Staff can ONLY access receipts from their assigned warehouse(s).
/// </summary>
[ApiController]
[Route("api/staff/receipts")]
[Authorize(Roles = "staff,admin")]
public class ReceiptController : ControllerBase
{
    private readonly IReceiptService _receiptService;
    private readonly IStaffMemberService _staffMemberService;
    private readonly IWarehouseService _warehouseService;
    private readonly IShipmentService _shipmentService;

    public ReceiptController(
        IReceiptService receiptService,
        IStaffMemberService staffMemberService,
        IWarehouseService warehouseService,
        IShipmentService shipmentService)
    {
        _receiptService = receiptService;
        _staffMemberService = staffMemberService;
        _warehouseService = warehouseService;
        _shipmentService = shipmentService;
    }

    /// <summary>
    /// Get receipts — auto-scoped to staff's single warehouse
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<ReceiptDto>>> GetReceipts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? warehouseId = null,
        [FromQuery] string? status = null)
    {
        // Admin can see all
        if (User.IsInRole("admin"))
        {
            var result = await _receiptService.GetReceiptsAsync(page, pageSize, warehouseId, status);
            return Ok(result);
        }

        // Staff: enforce single warehouse scope
        var effectiveWarehouseId = await ResolveWarehouseIdAsync(warehouseId);
        if (effectiveWarehouseId == null)
            return BadRequest(new { message = "No warehouse assigned" });

        var receipts = await _receiptService.GetReceiptsAsync(page, pageSize, effectiveWarehouseId, status);
        return Ok(receipts);
    }

    /// <summary>
    /// Get receipt by ID — must belong to staff's warehouse
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ReceiptDto>> GetReceipt(Guid id)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var receipt = await _receiptService.GetReceiptByIdAsync(id);
        if (receipt == null) return NotFound();

        // Enforce warehouse access (skip for admin)
        if (!User.IsInRole("admin"))
        {
            if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, receipt.WarehouseId))
                return Forbid("Receipt does not belong to your assigned warehouse");
        }

        return Ok(receipt);
    }

    /// <summary>
    /// Get receipt by shipment ID — must belong to staff's warehouse
    /// </summary>
    [HttpGet("by-shipment/{shipmentId}")]
    public async Task<ActionResult<ReceiptDto>> GetReceiptByShipment(Guid shipmentId)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var receipt = await _receiptService.GetReceiptByShipmentIdAsync(shipmentId);
        if (receipt == null) return NotFound();

        if (!User.IsInRole("admin"))
        {
            if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, receipt.WarehouseId))
                return Forbid("Receipt does not belong to your assigned warehouse");
        }

        return Ok(receipt);
    }

    /// <summary>
    /// Create new receipt from shipment arrival.
    /// ENFORCES: shipment must belong to staff's warehouse + must have documents.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReceiptDto>> CreateReceipt([FromBody] CreateReceiptRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        // Verify shipment belongs to staff's warehouse
        var shipment = await _shipmentService.GetShipmentByIdAsync(request.ShipmentId);
        if (shipment == null)
            return BadRequest(new { message = "Shipment not found" });

        if (!User.IsInRole("admin"))
        {
            if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, shipment.WarehouseId))
                return Forbid("Shipment does not belong to your assigned warehouse");
        }

        // DOCUMENT CHECK: Biên lai / chứng từ giao hàng phải có
        if (shipment.Documents == null || !shipment.Documents.Any())
        {
            return BadRequest(new { message = "Cannot create receipt: shipment has no documents (biên lai / chứng từ giao hàng). Contact supplier to upload documents first." });
        }

        try
        {
            var receipt = await _receiptService.CreateReceiptAsync(request, staffId.Value);
            return CreatedAtAction(nameof(GetReceipt), new { id = receipt.Id }, receipt);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Start inspection — warehouse auth enforced
    /// </summary>
    [HttpPost("{id}/start-inspection")]
    public async Task<ActionResult<ReceiptDto>> StartInspection(Guid id)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        // Verify warehouse access
        var receipt = await _receiptService.GetReceiptByIdAsync(id);
        if (receipt == null) return NotFound();

        if (!User.IsInRole("admin"))
        {
            if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, receipt.WarehouseId))
                return Forbid("Receipt does not belong to your assigned warehouse");
        }

        try
        {
            var result = await _receiptService.StartInspectionAsync(id, staffId.Value);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Inspect item — requires can_approve_receipts permission + warehouse auth
    /// </summary>
    [HttpPost("{receiptId}/items/{itemId}/inspect")]
    public async Task<ActionResult<ReceiptDto>> InspectItem(
        Guid receiptId, 
        Guid itemId, 
        [FromBody] InspectReceiptItemRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        // Permission check
        var hasPermission = await _staffMemberService.HasPermissionAsync(staffId.Value, "can_approve_receipts");
        if (!hasPermission) return Forbid("Inspection permission required");

        // Warehouse auth
        var receipt = await _receiptService.GetReceiptByIdAsync(receiptId);
        if (receipt == null) return NotFound();

        if (!User.IsInRole("admin"))
        {
            if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, receipt.WarehouseId))
                return Forbid("Receipt does not belong to your assigned warehouse");
        }

        try
        {
            var result = await _receiptService.InspectItemAsync(receiptId, itemId, request);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Complete inspection — requires can_approve_receipts + warehouse auth
    /// </summary>
    [HttpPost("{id}/complete-inspection")]
    public async Task<ActionResult<ReceiptDto>> CompleteInspection(Guid id, [FromBody] CompleteInspectionRequest request)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        var hasPermission = await _staffMemberService.HasPermissionAsync(staffId.Value, "can_approve_receipts");
        if (!hasPermission) return Forbid("Approval permission required");

        // Warehouse auth
        var receipt = await _receiptService.GetReceiptByIdAsync(id);
        if (receipt == null) return NotFound();

        if (!User.IsInRole("admin"))
        {
            if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, receipt.WarehouseId))
                return Forbid("Receipt does not belong to your assigned warehouse");
        }

        try
        {
            var result = await _receiptService.CompleteInspectionAsync(id, request, staffId.Value);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Store accepted items from receipt into inventory — warehouse auth enforced
    /// </summary>
    [HttpPost("{id}/store")]
    public async Task<ActionResult<ReceiptDto>> StoreReceipt(Guid id)
    {
        var staffId = await GetCurrentStaffIdAsync();
        if (staffId == null) return Forbid("Staff profile required");

        // Warehouse auth
        var receipt = await _receiptService.GetReceiptByIdAsync(id);
        if (receipt == null) return NotFound();

        if (!User.IsInRole("admin"))
        {
            if (!await _warehouseService.StaffHasWarehouseAccessAsync(staffId.Value, receipt.WarehouseId))
                return Forbid("Receipt does not belong to your assigned warehouse");
        }

        try
        {
            var result = await _receiptService.StoreReceiptAsync(id, staffId.Value);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get pending receipts for current staff's warehouse
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<PagedResponse<ReceiptDto>>> GetPendingReceipts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var effectiveWarehouseId = await ResolveWarehouseIdAsync();
        if (effectiveWarehouseId == null)
            return BadRequest(new { message = "No warehouse assigned" });

        var result = await _receiptService.GetReceiptsAsync(page, pageSize, effectiveWarehouseId, "pending");
        return Ok(result);
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
