using FoodCare.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/coupons")]
    [Authorize(Roles = "admin")]
    public class AdminCouponsController : ControllerBase
    {
        private readonly FoodCareDbContext _context;

        public AdminCouponsController(FoodCareDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var coupons = await _context.Coupons
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
            return Ok(coupons);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return NotFound();
            return Ok(coupon);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CouponCreateDto dto)
        {
            var coupon = new Coupon
            {
                Code = dto.Code.ToUpper(),
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MinOrderValue = dto.MinOrderValue,
                MaxDiscountAmount = dto.MaxDiscountAmount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                UsageLimit = dto.UsageLimit,
                UsageCount = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();
            
            return Ok(coupon);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CouponUpdateDto dto)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return NotFound();

            coupon.Code = dto.Code.ToUpper();
            coupon.DiscountType = dto.DiscountType;
            coupon.DiscountValue = dto.DiscountValue;
            coupon.MinOrderValue = dto.MinOrderValue;
            coupon.MaxDiscountAmount = dto.MaxDiscountAmount;
            coupon.StartDate = dto.StartDate;
            coupon.EndDate = dto.EndDate;
            coupon.UsageLimit = dto.UsageLimit;
            coupon.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(coupon);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return NotFound();

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa mã giảm giá thành công" });
        }
    }

    public class CouponCreateDto
    {
        public string Code { get; set; } = null!;
        public string? DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? UsageLimit { get; set; }
    }

    public class CouponUpdateDto : CouponCreateDto
    {
        public bool? IsActive { get; set; }
    }
}
