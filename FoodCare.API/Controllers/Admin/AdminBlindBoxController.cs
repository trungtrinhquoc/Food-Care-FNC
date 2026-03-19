using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/blind-boxes")]
[Authorize(Roles = "admin")]
public class AdminBlindBoxController : ControllerBase
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<AdminBlindBoxController> _logger;

    public AdminBlindBoxController(FoodCareDbContext context, ILogger<AdminBlindBoxController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET /api/admin/blind-boxes?status=pending&page=1&pageSize=20
    [HttpGet]
    public async Task<ActionResult<BlindBoxListResult>> GetBlindBoxes(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = _context.BlindBoxes
                .Include(b => b.Supplier)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(b => b.Status == status);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(b => b.CreatedAt)
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
                    RejectionReason = b.RejectionReason,
                    CreatedAt = b.CreatedAt,
                    DaysUntilExpiry = (int)(b.ExpiryDate - DateTime.UtcNow).TotalDays,
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
            _logger.LogError(ex, "Error retrieving blind boxes");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách blind box" });
        }
    }

    // GET /api/admin/blind-boxes/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BlindBoxDto>> GetBlindBox(Guid id)
    {
        try
        {
            var b = await _context.BlindBoxes
                .Include(x => x.Supplier)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (b == null)
                return NotFound(new { message = $"BlindBox {id} not found" });

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
                RejectionReason = b.RejectionReason,
                CreatedAt = b.CreatedAt,
                DaysUntilExpiry = (int)(b.ExpiryDate - DateTime.UtcNow).TotalDays,
                QuantityAvailable = b.Quantity - b.QuantitySold,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving blind box {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy chi tiết blind box" });
        }
    }

    // PATCH /api/admin/blind-boxes/{id}/approve
    [HttpPatch("{id:guid}/approve")]
    public async Task<ActionResult> ApproveBlindBox(Guid id, [FromBody] ApproveBlindBoxDto dto)
    {
        try
        {
            var blindBox = await _context.BlindBoxes.FindAsync(id);
            if (blindBox == null)
                return NotFound(new { message = $"BlindBox {id} not found" });

            blindBox.Status = "approved";
            if (dto.AdjustedPrice.HasValue && dto.AdjustedPrice.Value > 0)
                blindBox.BlindBoxPrice = dto.AdjustedPrice.Value;

            blindBox.RejectionReason = null;
            blindBox.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Blind box đã được duyệt thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving blind box {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi duyệt blind box" });
        }
    }

    // PATCH /api/admin/blind-boxes/{id}/reject
    [HttpPatch("{id:guid}/reject")]
    public async Task<ActionResult> RejectBlindBox(Guid id, [FromBody] RejectBlindBoxDto dto)
    {
        try
        {
            var blindBox = await _context.BlindBoxes.FindAsync(id);
            if (blindBox == null)
                return NotFound(new { message = $"BlindBox {id} not found" });

            blindBox.Status = "rejected";
            blindBox.RejectionReason = dto.Reason;
            blindBox.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Blind box đã bị từ chối" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting blind box {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi từ chối blind box" });
        }
    }

    // PATCH /api/admin/blind-boxes/{id}/archive
    [HttpPatch("{id:guid}/archive")]
    public async Task<ActionResult> ArchiveBlindBox(Guid id)
    {
        try
        {
            var blindBox = await _context.BlindBoxes.FindAsync(id);
            if (blindBox == null)
                return NotFound(new { message = $"BlindBox {id} not found" });

            blindBox.Status = "archived";
            blindBox.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Blind box đã được lưu trữ" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error archiving blind box {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lưu trữ blind box" });
        }
    }
}
