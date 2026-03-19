using FoodCare.API.Extensions;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Controllers;

/// <summary>Customer-facing Blind Box endpoints (browse + purchase)</summary>
[ApiController]
[Route("api/blind-boxes")]
public class BlindBoxController : ControllerBase
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<BlindBoxController> _logger;

    public BlindBoxController(FoodCareDbContext context, ILogger<BlindBoxController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET /api/blind-boxes?page=1&pageSize=12
    [HttpGet]
    public async Task<ActionResult> GetBlindBoxes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        try
        {
            var query = _context.BlindBoxes
                .Include(b => b.Supplier)
                .Where(b => b.Status == "approved" && (b.Quantity - b.QuantitySold) > 0)
                .AsQueryable();

            var totalCount = await query.CountAsync();

            var now = DateTime.UtcNow;
            var items = await query
                .OrderBy(b => b.ExpiryDate)   // sắp xếp gần hết hạn lên đầu
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BlindBoxDto
                {
                    Id = b.Id,
                    SupplierId = b.SupplierId,
                    StoreName = b.Supplier.StoreName,
                    Title = b.Title,
                    Description = b.Description,
                    OriginalValue = b.OriginalValue,
                    BlindBoxPrice = b.BlindBoxPrice,
                    Quantity = b.Quantity,
                    QuantitySold = b.QuantitySold,
                    ExpiryDate = b.ExpiryDate,
                    Contents = b.Contents,
                    ImageUrl = b.ImageUrl,
                    Status = b.Status,
                    RejectionReason = null,
                    CreatedAt = b.CreatedAt,
                    DaysUntilExpiry = (int)(b.ExpiryDate - now).TotalDays,
                    QuantityAvailable = b.Quantity - b.QuantitySold,
                })
                .ToListAsync();

            return Ok(new BlindBoxListResult
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving blind boxes for customers");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách Blind Box" });
        }
    }

    // GET /api/blind-boxes/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BlindBoxDto>> GetBlindBox(Guid id)
    {
        try
        {
            var b = await _context.BlindBoxes
                .Include(x => x.Supplier)
                .FirstOrDefaultAsync(x => x.Id == id && x.Status == "approved");

            if (b == null)
                return NotFound(new { message = "Không tìm thấy Blind Box" });

            var now = DateTime.UtcNow;
            return Ok(new BlindBoxDto
            {
                Id = b.Id,
                SupplierId = b.SupplierId,
                StoreName = b.Supplier.StoreName,
                Title = b.Title,
                Description = b.Description,
                OriginalValue = b.OriginalValue,
                BlindBoxPrice = b.BlindBoxPrice,
                Quantity = b.Quantity,
                QuantitySold = b.QuantitySold,
                ExpiryDate = b.ExpiryDate,
                Contents = b.Contents,
                ImageUrl = b.ImageUrl,
                Status = b.Status,
                RejectionReason = null,
                CreatedAt = b.CreatedAt,
                DaysUntilExpiry = (int)(b.ExpiryDate - now).TotalDays,
                QuantityAvailable = b.Quantity - b.QuantitySold,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving blind box {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy chi tiết Blind Box" });
        }
    }

    // POST /api/blind-boxes/{id}/purchase   [Authorize]
    [HttpPost("{id:guid}/purchase")]
    [Authorize]
    public async Task<ActionResult> PurchaseBlindBox(Guid id)
    {
        try
        {
            var userId = User.GetUserId();

            // Load blind box with lock
            var blindBox = await _context.BlindBoxes
                .Include(b => b.Supplier)
                .FirstOrDefaultAsync(b => b.Id == id && b.Status == "approved");

            if (blindBox == null)
                return NotFound(new { message = "Không tìm thấy Blind Box" });

            if (blindBox.Quantity - blindBox.QuantitySold <= 0)
                return BadRequest(new { message = "Blind Box đã hết hàng" });

            // Load user wallet
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "Không tìm thấy tài khoản" });

            if (user.AccountBalance < blindBox.BlindBoxPrice)
                return BadRequest(new {
                    message = $"Số dư ví không đủ. Cần {blindBox.BlindBoxPrice:N0}đ, hiện có {user.AccountBalance:N0}đ."
                });

            // Deduct wallet & increment sold
            user.AccountBalance -= blindBox.BlindBoxPrice;
            blindBox.QuantitySold += 1;

            // Mark sold out if needed
            if (blindBox.QuantitySold >= blindBox.Quantity)
                blindBox.Status = "sold_out";

            blindBox.UpdatedAt = DateTime.UtcNow;

            // Record wallet transaction
            _context.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Amount = -blindBox.BlindBoxPrice,
                Type = WalletTransactionType.Payment,
                Status = WalletTransactionStatus.Completed,
                Description = $"Mua Blind Box: {blindBox.Title}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Mua Blind Box thành công! Sản phẩm sẽ được giao đến bạn trong vài ngày tới.",
                blindBoxTitle = blindBox.Title,
                storeName = blindBox.Supplier.StoreName,
                pricePaid = blindBox.BlindBoxPrice,
                newBalance = user.AccountBalance,
                expiryDate = blindBox.ExpiryDate,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error purchasing blind box {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi mua Blind Box" });
        }
    }
}
