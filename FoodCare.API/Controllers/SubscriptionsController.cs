using System.Security.Claims;
using FoodCare.API.Models.DTOs.Subscriptions;
using FoodCare.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // user phải đăng nhập
    public class SubscriptionsController : ControllerBase
    {
        private readonly ISubscriptionService _subscriptionService;
        private readonly ILogger<SubscriptionsController> _logger;

        public SubscriptionsController(
            ISubscriptionService subscriptionService,
            ILogger<SubscriptionsController> logger)
        {
            _subscriptionService = subscriptionService;
            _logger = logger;
        }

        // ===================== OPTIONS =====================

        /// <summary>
        /// Lấy danh sách subscription options (weekly, monthly...)
        /// </summary>
        [HttpGet("options")]
        [AllowAnonymous] // FE public cũng xem được
        public async Task<IActionResult> GetSubscriptionOptions()
        {
            var options = await _subscriptionService.GetSubscriptionOptionsAsync();
            return Ok(options);
        }

        // ===================== CREATE =====================

        /// <summary>
        /// Tạo subscription mới cho user hiện tại
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateSubscription([FromBody] CreateSubscriptionDto dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var result = await _subscriptionService.CreateSubscriptionAsync(dto, userId);
            return Ok(result);
        }

        // ===================== GET USER SUBSCRIPTIONS =====================

        /// <summary>
        /// Lấy danh sách subscription của user hiện tại
        /// </summary>
        [HttpGet("my")]
        public async Task<IActionResult> GetMySubscriptions()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var subscriptions = await _subscriptionService.GetUserSubscriptionsAsync(userId);
            return Ok(subscriptions);
        }

        // ===================== PAUSE =====================

        /// <summary>
        /// Pause subscription
        /// </summary>
        [HttpPut("{id}/pause")]
        public async Task<IActionResult> PauseSubscription(
            Guid id,
            [FromQuery] DateOnly? pauseUntil)
        {
            var success = await _subscriptionService.PauseSubscriptionAsync(id, pauseUntil);
            if (!success)
                return NotFound();

            return NoContent();
        }

        // ===================== RESUME =====================

        /// <summary>
        /// Resume subscription
        /// </summary>
        [HttpPut("{id}/resume")]
        public async Task<IActionResult> ResumeSubscription(Guid id)
        {
            var success = await _subscriptionService.ResumeSubscriptionAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }

        // ===================== HELPER =====================

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId)
                ? userId
                : Guid.Empty;
        }
    }
}
