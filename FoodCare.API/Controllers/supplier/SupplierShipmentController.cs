using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;
using FoodCare.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FoodCare.API.Controllers.Supplier;

[ApiController]
[Route("api/supplier/shipments")]
[Authorize(Roles = "supplier")]
public class SupplierShipmentController : ControllerBase
{
    private readonly IShipmentService _shipmentService;
    private readonly FoodCareDbContext _context;

    public SupplierShipmentController(IShipmentService shipmentService, FoodCareDbContext context)
    {
        _shipmentService = shipmentService;
        _context = context;
    }

    /// <summary>
    /// Get all shipments for current supplier
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<SupplierShipmentDto>>> GetMyShipments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null)
    {
        var supplierId = GetCurrentUserGuid();
        if (supplierId == null) return Forbid("User ID required");

        var result = await _shipmentService.GetShipmentsBySupplierAsync(supplierId.Value, page, pageSize, status);
        return Ok(result);
    }

    /// <summary>
    /// Get shipment by ID (must belong to current supplier)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SupplierShipmentDto>> GetShipment(Guid id)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        var shipment = await _shipmentService.GetShipmentByIdAsync(id);
        if (shipment == null) return NotFound();

        // Verify ownership
        if (shipment.SupplierId != supplierIntId.Value)
            return Forbid("Not authorized to view this shipment");

        return Ok(shipment);
    }

    /// <summary>
    /// Create new shipment draft
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SupplierShipmentDto>> CreateShipment([FromBody] CreateSupplierShipmentRequest request)
    {
        var supplierId = GetCurrentUserGuid();
        if (supplierId == null) return Forbid("User ID required");

        try
        {
            var shipment = await _shipmentService.CreateShipmentAsync(request, supplierId.Value);
            return CreatedAtAction(nameof(GetShipment), new { id = shipment.Id }, shipment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update shipment draft
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SupplierShipmentDto>> UpdateShipment(Guid id, [FromBody] UpdateSupplierShipmentRequest request)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        // Verify ownership
        var existing = await _shipmentService.GetShipmentByIdAsync(id);
        if (existing == null) return NotFound();
        if (existing.SupplierId != supplierIntId.Value) return Forbid("Not authorized to update this shipment");

        try
        {
            var shipment = await _shipmentService.UpdateShipmentAsync(id, request);
            if (shipment == null) return NotFound();
            return Ok(shipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Add item to shipment
    /// </summary>
    [HttpPost("{id}/items")]
    public async Task<ActionResult<SupplierShipmentDto>> AddItem(Guid id, [FromBody] AddShipmentItemRequest request)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        // Verify ownership
        var existing = await _shipmentService.GetShipmentByIdAsync(id);
        if (existing == null) return NotFound();
        if (existing.SupplierId != supplierIntId.Value) return Forbid();

        try
        {
            var shipment = await _shipmentService.AddShipmentItemAsync(id, request);
            if (shipment == null) return NotFound();
            return Ok(shipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update shipment item
    /// </summary>
    [HttpPut("{id}/items/{itemId}")]
    public async Task<ActionResult<SupplierShipmentDto>> UpdateItem(
        Guid id, 
        Guid itemId, 
        [FromBody] UpdateShipmentItemRequest request)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        // Verify ownership
        var existing = await _shipmentService.GetShipmentByIdAsync(id);
        if (existing == null) return NotFound();
        if (existing.SupplierId != supplierIntId.Value) return Forbid();

        try
        {
            var shipment = await _shipmentService.UpdateShipmentItemAsync(id, itemId, request);
            if (shipment == null) return NotFound();
            return Ok(shipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Remove item from shipment
    /// </summary>
    [HttpDelete("{id}/items/{itemId}")]
    public async Task<ActionResult> RemoveItem(Guid id, Guid itemId)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        // Verify ownership
        var existing = await _shipmentService.GetShipmentByIdAsync(id);
        if (existing == null) return NotFound();
        if (existing.SupplierId != supplierIntId.Value) return Forbid();

        try
        {
            var result = await _shipmentService.RemoveShipmentItemAsync(id, itemId);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Add document to shipment
    /// </summary>
    [HttpPost("{id}/documents")]
    public async Task<ActionResult<ShipmentDocumentDto>> AddDocument(Guid id, [FromBody] AddShipmentDocumentRequest request)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        // Verify ownership
        var existing = await _shipmentService.GetShipmentByIdAsync(id);
        if (existing == null) return NotFound();
        if (existing.SupplierId != supplierIntId.Value) return Forbid();

        try
        {
            var document = await _shipmentService.AddDocumentAsync(id, request);
            return Ok(document);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Dispatch shipment (mark as sent)
    /// </summary>
    [HttpPost("{id}/dispatch")]
    public async Task<ActionResult<SupplierShipmentDto>> DispatchShipment(Guid id, [FromBody] DispatchShipmentRequest request)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        // Verify ownership
        var existing = await _shipmentService.GetShipmentByIdAsync(id);
        if (existing == null) return NotFound();
        if (existing.SupplierId != supplierIntId.Value) return Forbid();

        try
        {
            var shipment = await _shipmentService.DispatchShipmentAsync(id, request);
            if (shipment == null) return NotFound();
            return Ok(shipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Mark shipment as in transit
    /// </summary>
    [HttpPost("{id}/in-transit")]
    public async Task<ActionResult<SupplierShipmentDto>> MarkInTransit(Guid id, [FromBody] UpdateTransitRequest request)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        // Verify ownership
        var existing = await _shipmentService.GetShipmentByIdAsync(id);
        if (existing == null) return NotFound();
        if (existing.SupplierId != supplierIntId.Value) return Forbid();

        try
        {
            var shipment = await _shipmentService.MarkInTransitAsync(id, request);
            if (shipment == null) return NotFound();
            return Ok(shipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cancel shipment
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult> CancelShipment(Guid id, [FromBody] CancelShipmentRequest request)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        // Verify ownership
        var existing = await _shipmentService.GetShipmentByIdAsync(id);
        if (existing == null) return NotFound();
        if (existing.SupplierId != supplierIntId.Value) return Forbid();

        try
        {
            var result = await _shipmentService.CancelShipmentAsync(id, request);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get shipment status history
    /// </summary>
    [HttpGet("{id}/history")]
    public async Task<ActionResult<IEnumerable<ShipmentStatusHistoryDto>>> GetShipmentHistory(Guid id)
    {
        var supplierIntId = await GetSupplierIntIdAsync();
        if (supplierIntId == null) return Forbid("Supplier ID required");

        // Verify ownership
        var existing = await _shipmentService.GetShipmentByIdAsync(id);
        if (existing == null) return NotFound();
        if (existing.SupplierId != supplierIntId.Value) return Forbid();

        var history = await _shipmentService.GetStatusHistoryAsync(id);
        return Ok(history);
    }

    /// <summary>
    /// Get shipment statistics for current supplier
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetShipmentStats()
    {
        var supplierId = GetCurrentUserGuid();
        if (supplierId == null) return Forbid("User ID required");

        var stats = await _shipmentService.GetSupplierShipmentStatsAsync(supplierId.Value);
        return Ok(stats);
    }

    private Guid? GetCurrentUserGuid()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("supplier_id")?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private async Task<int?> GetSupplierIntIdAsync()
    {
        var userId = GetCurrentUserGuid();
        if (userId == null) return null;

        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == userId.Value);
        return supplier?.Id;
    }
}
