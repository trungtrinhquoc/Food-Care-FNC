using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Admin.Users;
using FoodCare.API.Services.Interfaces.Admin;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "admin")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _userService;

    public AdminUsersController(IAdminUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Get paginated list of users with filters
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] AdminUserFilterDto filter)
    {
        var result = await _userService.GetUsersAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "Không tìm thấy người dùng" });
        
        return Ok(user);
    }

    /// <summary>
    /// Get user statistics for dashboard
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _userService.GetUserStatsAsync();
        return Ok(stats);
    }

    /// <summary>
    /// Get all member tiers for dropdown
    /// </summary>
    [HttpGet("tiers")]
    public async Task<IActionResult> GetMemberTiers()
    {
        var tiers = await _userService.GetMemberTiersAsync();
        return Ok(tiers);
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        try
        {
            var user = await _userService.CreateUserAsync(dto);
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update user information
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
    {
        var user = await _userService.UpdateUserAsync(id, dto);
        if (user == null)
            return NotFound(new { message = "Không tìm thấy người dùng" });
        
        return Ok(user);
    }

    /// <summary>
    /// Change user password (admin override)
    /// </summary>
    [HttpPost("{id:guid}/change-password")]
    public async Task<IActionResult> ChangePassword(Guid id, [FromBody] AdminChangePasswordDto dto)
    {
        var success = await _userService.ChangePasswordAsync(id, dto);
        if (!success)
            return NotFound(new { message = "Không tìm thấy người dùng" });
        
        return Ok(new { message = "Đổi mật khẩu thành công" });
    }

    /// <summary>
    /// Toggle user active status
    /// </summary>
    [HttpPatch("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var user = await _userService.ToggleActiveStatusAsync(id);
        if (user == null)
            return NotFound(new { message = "Không tìm thấy người dùng" });
        
        return Ok(user);
    }

    /// <summary>
    /// Delete user (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var success = await _userService.DeleteUserAsync(id);
        if (!success)
            return NotFound(new { message = "Không tìm thấy người dùng" });
        
        return Ok(new { message = "Xóa người dùng thành công" });
    }
}
