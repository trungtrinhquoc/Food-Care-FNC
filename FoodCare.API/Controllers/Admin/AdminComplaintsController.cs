using FoodCare.API.Extensions;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/complaints")]
[Authorize(Roles = "admin")]
public class AdminComplaintsController : ControllerBase
{
    private readonly IAdminComplaintService _complaintService;
    private readonly ILogger<AdminComplaintsController> _logger;

    public AdminComplaintsController(
        IAdminComplaintService complaintService,
        ILogger<AdminComplaintsController> logger)
    {
        _complaintService = complaintService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetComplaints([FromQuery] ComplaintFilterDto filter)
    {
        try
        {
            var result = await _complaintService.GetComplaintsAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving complaints");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách khiếu nại" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetComplaint(Guid id)
    {
        try
        {
            var result = await _complaintService.GetByIdAsync(id);
            if (result == null) return NotFound(new { message = "Không tìm thấy khiếu nại" });
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving complaint {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy khiếu nại" });
        }
    }

    [HttpPatch("{id}/action")]
    public async Task<ActionResult> ActionComplaint(Guid id, [FromBody] ResolveComplaintDto dto)
    {
        try
        {
            var result = await _complaintService.ActionAsync(id, dto);
            if (result == null) return NotFound(new { message = "Không tìm thấy khiếu nại" });
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing complaint action {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi xử lý khiếu nại" });
        }
    }
}

// Separate controller for customer to create complaints
[ApiController]
[Route("api/complaints")]
[Authorize]
public class ComplaintsController : ControllerBase
{
    private readonly IAdminComplaintService _complaintService;
    private readonly ILogger<ComplaintsController> _logger;

    public ComplaintsController(
        IAdminComplaintService complaintService,
        ILogger<ComplaintsController> logger)
    {
        _complaintService = complaintService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult> CreateComplaint([FromBody] CreateComplaintDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            var result = await _complaintService.CreateComplaintAsync(dto, userId);
            return CreatedAtAction(nameof(CreateComplaint), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating complaint");
            return StatusCode(500, new { message = "Lỗi khi tạo khiếu nại" });
        }
    }
}
