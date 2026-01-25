using FoodCare.API.Models.DTOs.Chat;
using FoodCare.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodCare.API.Controllers;

/// <summary>
/// Simplified chat controller - stateless Q&A only
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    /// <summary>
    /// Ask a question and get an answer (stateless)
    /// </summary>
    [HttpPost("ask")]
    public async Task<ActionResult<ChatResponseDto>> AskQuestion(
        [FromBody] AskQuestionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
        {
            return BadRequest(new { error = "Question is required" });
        }

        var userId = GetCurrentUserId();
        
        var answer = await _chatService.AskQuestionAsync(
            request.Question,
            userId
        );

        return Ok(new ChatResponseDto
        {
            Answer = answer,
            Timestamp = DateTime.UtcNow
        });
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return Guid.Parse(userIdClaim);
    }
}
