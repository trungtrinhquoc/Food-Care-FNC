using FoodCare.API.Models.DTOs.Admin.Zalo;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/zalo")]
[Authorize(Roles = "admin")]
public class AdminZaloController : ControllerBase
{
    private readonly IAdminZaloService _zaloService;
    private readonly ILogger<AdminZaloController> _logger;

    public AdminZaloController(
        IAdminZaloService zaloService,
        ILogger<AdminZaloController> logger)
    {
        _zaloService = zaloService;
        _logger = logger;
    }

    [HttpGet("messages")]
    public async Task<ActionResult> GetMessages([FromQuery] ZaloMessageFilterDto filter)
    {
        try
        {
            var result = await _zaloService.GetZaloMessagesAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Zalo messages");
            return StatusCode(500, new { message = "An error occurred while retrieving Zalo messages" });
        }
    }

    [HttpGet("templates")]
    public async Task<ActionResult> GetTemplates()
    {
        try
        {
            var templates = await _zaloService.GetZaloTemplatesAsync();
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Zalo templates");
            return StatusCode(500, new { message = "An error occurred while retrieving Zalo templates" });
        }
    }

    [HttpPost("send")]
    public async Task<ActionResult> SendMessage([FromBody] SendZaloMessageDto request)
    {
        try
        {
            var result = await _zaloService.SendZaloMessageAsync(request);
            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending Zalo message");
            return StatusCode(500, new { message = "An error occurred while sending the Zalo message" });
        }
    }
}
