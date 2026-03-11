using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.Admin;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/deliveries")]
[Authorize(Roles = "admin")]
public class AdminDeliveryController : ControllerBase
{
    private readonly IAdminDeliveryService _deliveryService;
    private readonly ILogger<AdminDeliveryController> _logger;

    public AdminDeliveryController(
        IAdminDeliveryService deliveryService,
        ILogger<AdminDeliveryController> logger)
    {
        _deliveryService = deliveryService;
        _logger = logger;
    }

    // =====================================================
    // DELIVERY QUERIES
    // =====================================================

    /// <summary>
    /// Get all deliveries with filters (admin view across all warehouses)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<AdminDeliverySummaryDto>>> GetAllDeliveries(
        [FromQuery] DeliveryFilterDto filter)
    {
        var result = await _deliveryService.GetAllDeliveriesAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Get deliveries pending admin approval
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<PagedResponse<AdminDeliverySummaryDto>>> GetPendingDeliveries(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _deliveryService.GetPendingDeliveriesAsync(page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Get delivery detail with full governance info
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AdminDeliveryDetailDto>> GetDeliveryDetail(Guid id)
    {
        var detail = await _deliveryService.GetDeliveryDetailAsync(id);
        if (detail == null) return NotFound(new { message = "Delivery not found" });
        return Ok(detail);
    }

    // =====================================================
    // ADMIN ACTIONS
    // =====================================================

    /// <summary>
    /// Delete a shipment (admin only)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteShipment(Guid id)
    {
        try
        {
            var result = await _deliveryService.DeleteShipmentAsync(id);
            if (!result) return NotFound(new { message = "Delivery not found" });
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete an inbound session (admin only)
    /// </summary>
    [HttpDelete("sessions/{id}")]
    public async Task<ActionResult> DeleteInboundSession(Guid id)
    {
        try
        {
            var result = await _deliveryService.DeleteInboundSessionAsync(id);
            if (!result) return NotFound(new { message = "Inbound session not found" });
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // =====================================================
    // AUDIT LOG
    // =====================================================

    /// <summary>
    /// Get audit log entries with filters
    /// </summary>
    [HttpGet("audit-log")]
    public async Task<ActionResult<PagedResponse<AdminActionLogDto>>> GetAuditLog(
        [FromQuery] AuditLogFilterDto filter)
    {
        var result = await _deliveryService.GetAuditLogAsync(filter);
        return Ok(result);
    }

    // =====================================================
    // KPI
    // =====================================================

    /// <summary>
    /// Get delivery KPI for a specific warehouse
    /// </summary>
    [HttpGet("kpi/{warehouseId}")]
    public async Task<ActionResult<DeliveryKpiDto>> GetWarehouseKpi(
        Guid warehouseId,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        try
        {
            var kpi = await _deliveryService.GetDeliveryKpiAsync(warehouseId, from, to);
            return Ok(kpi);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get delivery KPIs for all warehouses
    /// </summary>
    [HttpGet("kpi")]
    public async Task<ActionResult<List<DeliveryKpiDto>>> GetAllWarehouseKpis(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var kpis = await _deliveryService.GetAllWarehouseKpisAsync(from, to);
        return Ok(kpis);
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private Guid? GetCurrentAdminId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
