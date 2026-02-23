using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Staff;
using FoodCare.API.Services.Interfaces.StaffModule;
using System.Security.Claims;

namespace FoodCare.API.Controllers.Staff;

[ApiController]
[Route("api/staff")]
[Authorize(Roles = "staff,admin")]
public class StaffController : ControllerBase
{
    private readonly IStaffMemberService _staffMemberService;
    private readonly IWarehouseService _warehouseService;

    public StaffController(
        IStaffMemberService staffMemberService,
        IWarehouseService warehouseService)
    {
        _staffMemberService = staffMemberService;
        _warehouseService = warehouseService;
    }

    // =====================================================
    // STAFF MEMBER ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get all staff members
    /// </summary>
    [HttpGet("members")]
    public async Task<ActionResult<PagedResponse<StaffMemberDto>>> GetStaffMembers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? warehouseId = null,
        [FromQuery] bool? isActive = null)
    {
        var result = await _staffMemberService.GetStaffMembersAsync(page, pageSize, warehouseId, isActive);
        return Ok(result);
    }

    /// <summary>
    /// Get staff member by ID
    /// </summary>
    [HttpGet("members/{id}")]
    public async Task<ActionResult<StaffMemberDto>> GetStaffMember(Guid id)
    {
        var staff = await _staffMemberService.GetStaffMemberByIdAsync(id);
        if (staff == null) return NotFound();
        return Ok(staff);
    }

    /// <summary>
    /// Get current staff member profile
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<StaffMemberDto>> GetCurrentStaff()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var staff = await _staffMemberService.GetStaffMemberByUserIdAsync(userId.Value);
        if (staff == null) return NotFound(new { message = "Staff profile not found" });
        return Ok(staff);
    }

    /// <summary>
    /// Create new staff member (Admin only)
    /// </summary>
    [HttpPost("members")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<StaffMemberDto>> CreateStaffMember([FromBody] CreateStaffMemberRequest request)
    {
        try
        {
            var staff = await _staffMemberService.CreateStaffMemberAsync(request);
            return CreatedAtAction(nameof(GetStaffMember), new { id = staff.Id }, staff);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update staff member (Admin only)
    /// </summary>
    [HttpPut("members/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<StaffMemberDto>> UpdateStaffMember(Guid id, [FromBody] UpdateStaffMemberRequest request)
    {
        var staff = await _staffMemberService.UpdateStaffMemberAsync(id, request);
        if (staff == null) return NotFound();
        return Ok(staff);
    }

    /// <summary>
    /// Deactivate staff member (Admin only)
    /// </summary>
    [HttpDelete("members/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteStaffMember(Guid id)
    {
        var result = await _staffMemberService.DeleteStaffMemberAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    /// <summary>
    /// Assign staff member to warehouse
    /// </summary>
    [HttpPost("members/{staffId}/assign-warehouse/{warehouseId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AssignToWarehouse(Guid staffId, Guid warehouseId)
    {
        var result = await _staffMemberService.AssignToWarehouseAsync(staffId, warehouseId);
        if (!result) return NotFound();
        return NoContent();
    }

    // =====================================================
    // WAREHOUSE ENDPOINTS
    // =====================================================

    /// <summary>
    /// Get warehouses — Staff only sees their assigned warehouse, Admin sees all
    /// </summary>
    [HttpGet("warehouses")]
    public async Task<ActionResult<PagedResponse<WarehouseDto>>> GetWarehouses(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isActive = null)
    {
        // Admin sees all warehouses
        if (User.IsInRole("admin"))
        {
            var result = await _warehouseService.GetWarehousesAsync(page, pageSize, isActive);
            return Ok(result);
        }

        // Staff: only return their assigned warehouse
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var staff = await _staffMemberService.GetStaffMemberByUserIdAsync(userId.Value);
        if (staff?.WarehouseId == null)
            return Ok(new PagedResponse<WarehouseDto> { Items = new List<WarehouseDto>(), TotalCount = 0, Page = 1, PageSize = 20 });

        var warehouse = await _warehouseService.GetWarehouseByIdAsync(staff.WarehouseId.Value);
        if (warehouse == null)
            return Ok(new PagedResponse<WarehouseDto> { Items = new List<WarehouseDto>(), TotalCount = 0, Page = 1, PageSize = 20 });

        return Ok(new PagedResponse<WarehouseDto>
        {
            Items = new List<WarehouseDto> { warehouse },
            TotalCount = 1,
            Page = 1,
            PageSize = 20
        });
    }

    /// <summary>
    /// Get warehouse by ID
    /// </summary>
    [HttpGet("warehouses/{id}")]
    public async Task<ActionResult<WarehouseDto>> GetWarehouse(Guid id)
    {
        var warehouse = await _warehouseService.GetWarehouseByIdAsync(id);
        if (warehouse == null) return NotFound();
        return Ok(warehouse);
    }

    /// <summary>
    /// Get default warehouse
    /// </summary>
    [HttpGet("warehouses/default")]
    public async Task<ActionResult<WarehouseDto>> GetDefaultWarehouse()
    {
        var warehouse = await _warehouseService.GetDefaultWarehouseAsync();
        if (warehouse == null) return NotFound(new { message = "No default warehouse configured" });
        return Ok(warehouse);
    }

    /// <summary>
    /// Create new warehouse (Admin only)
    /// </summary>
    [HttpPost("warehouses")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<WarehouseDto>> CreateWarehouse([FromBody] CreateWarehouseRequest request)
    {
        try
        {
            var warehouse = await _warehouseService.CreateWarehouseAsync(request);
            return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, warehouse);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update warehouse (Admin only)
    /// </summary>
    [HttpPut("warehouses/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<WarehouseDto>> UpdateWarehouse(Guid id, [FromBody] UpdateWarehouseRequest request)
    {
        var warehouse = await _warehouseService.UpdateWarehouseAsync(id, request);
        if (warehouse == null) return NotFound();
        return Ok(warehouse);
    }

    /// <summary>
    /// Deactivate warehouse (Admin only)
    /// </summary>
    [HttpDelete("warehouses/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteWarehouse(Guid id)
    {
        var result = await _warehouseService.DeleteWarehouseAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
