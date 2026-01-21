using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/customers/{customerId}/logs")]
[Authorize(Roles = "admin,staff")]
public class AdminCustomerLogsController : ControllerBase
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<AdminCustomerLogsController> _logger;

    public AdminCustomerLogsController(FoodCareDbContext context, ILogger<AdminCustomerLogsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy log đăng nhập của khách hàng
    /// </summary>
    [HttpGet("logins")]
    public async Task<ActionResult> GetLoginLogs(
        Guid customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = _context.LoginLogs
                .Where(l => l.UserId == customerId)
                .OrderByDescending(l => l.LoginAt);

            var totalItems = await query.CountAsync();

            var logs = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    l.Id,
                    l.LoginAt,
                    l.IpAddress,
                    l.DeviceType,
                    l.DeviceName,
                    l.Location,
                    l.CountryCode,
                    l.Success,
                    l.FailureReason
                })
                .ToListAsync();

            return Ok(new
            {
                Items = logs,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching login logs for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "Lỗi khi lấy log đăng nhập" });
        }
    }

    /// <summary>
    /// Lấy lịch sử tích điểm của khách hàng
    /// </summary>
    [HttpGet("points")]
    public async Task<ActionResult> GetPointsHistory(
        Guid customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = _context.PointsHistories
                .Where(p => p.UserId == customerId)
                .OrderByDescending(p => p.CreatedAt);

            var totalItems = await query.CountAsync();

            var logs = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    p.Points,
                    p.Type,
                    p.Description,
                    p.OrderId,
                    p.BalanceBefore,
                    p.BalanceAfter,
                    p.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                Items = logs,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching points history for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "Lỗi khi lấy lịch sử tích điểm" });
        }
    }

    /// <summary>
    /// Lấy log thanh toán của khách hàng
    /// </summary>
    [HttpGet("payments")]
    public async Task<ActionResult> GetPaymentLogs(
        Guid customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = _context.PaymentLogs
                .Where(p => p.UserId == customerId)
                .OrderByDescending(p => p.CreatedAt);

            var totalItems = await query.CountAsync();

            var logs = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    p.OrderId,
                    p.Amount,
                    p.PaymentMethod,
                    p.PaymentMethodName,
                    p.Status,
                    p.TransactionId,
                    p.PaidAt,
                    p.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                Items = logs,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching payment logs for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "Lỗi khi lấy log thanh toán" });
        }
    }

    /// <summary>
    /// Điều chỉnh điểm thưởng cho khách hàng (Admin only)
    /// </summary>
    [HttpPost("points/adjust")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> AdjustPoints(
        Guid customerId,
        [FromBody] AdjustPointsRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(customerId);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy khách hàng" });

            var currentBalance = user.LoyaltyPoints ?? 0;
            var newBalance = currentBalance + request.Points;

            if (newBalance < 0)
                return BadRequest(new { message = "Số điểm không đủ để trừ" });

            // Lấy admin ID từ token
            var adminIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
            Guid? adminId = Guid.TryParse(adminIdClaim, out var parsed) ? parsed : null;

            // Tạo record lịch sử
            var history = new PointsHistory
            {
                Id = Guid.NewGuid(),
                UserId = customerId,
                Points = request.Points,
                Type = request.Points >= 0 ? "adjust" : "redeem",
                Description = request.Description ?? (request.Points >= 0 ? "Admin cộng điểm" : "Admin trừ điểm"),
                BalanceBefore = currentBalance,
                BalanceAfter = newBalance,
                CreatedBy = adminId,
                CreatedAt = DateTime.UtcNow
            };

            _context.PointsHistories.Add(history);
            user.LoyaltyPoints = newBalance;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Điều chỉnh điểm thành công",
                history.Id,
                history.Points,
                history.Type,
                history.Description,
                history.BalanceBefore,
                history.BalanceAfter,
                history.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adjusting points for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "Lỗi khi điều chỉnh điểm" });
        }
    }
}

public class AdjustPointsRequest
{
    public int Points { get; set; }
    public string? Description { get; set; }
}
