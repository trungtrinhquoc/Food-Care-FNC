using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FoodCare.API.Exceptions;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Coupons;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations
{
    public class CouponService : ICouponService
    {
        private readonly FoodCareDbContext _context;

        public CouponService(FoodCareDbContext context)
        {
            _context = context;
        }

        public async Task<List<CouponDto>> GetAvailableCouponsAsync(decimal currentOrderValue, Guid userId)
        {
            var now = DateTime.UtcNow;

            var validCoupons = await _context.Coupons
                .Where(c => c.IsActive == true 
                            && (c.StartDate == null || c.StartDate <= now)
                            && (c.EndDate == null || c.EndDate >= now)
                            && (c.UsageLimit == null || c.UsageCount < c.UsageLimit)
                            && (c.MinOrderValue == null || c.MinOrderValue <= currentOrderValue))
                .ToListAsync();

            // Check if user already reached their limits (assuming 1 per user for simplicty, or just rely on total limit)
            var usedCouponIds = await _context.CouponUsages
                .Where(cu => cu.UserId == userId)
                .Select(cu => cu.CouponId)
                .ToListAsync();

            // Typically coupons can be restricted to 1 use per user
            var availableCoupons = validCoupons
                .Where(c => !usedCouponIds.Contains(c.Id))
                .Select(c => new CouponDto
                {
                    Id = c.Id,
                    Code = c.Code,
                    DiscountType = c.DiscountType,
                    DiscountValue = c.DiscountValue,
                    MinOrderValue = c.MinOrderValue,
                    MaxDiscountAmount = c.MaxDiscountAmount,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate
                }).ToList();

            return availableCoupons;
        }

        public async Task<CouponDto> ValidateCouponAsync(string code, decimal currentOrderValue, Guid userId)
        {
            var now = DateTime.UtcNow;

            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code.ToUpper() == code.ToUpper());

            if (coupon == null)
                throw new AppException("Mã giảm giá không tồn tại");

            if (coupon.IsActive == false)
                throw new AppException("Mã giảm giá không còn hoạt động");

            if (coupon.StartDate != null && coupon.StartDate > now)
                throw new AppException("Mã giảm giá chưa đến thời gian có hiệu lực");

            if (coupon.EndDate != null && coupon.EndDate < now)
                throw new AppException("Mã giảm giá đã hết hạn");

            if (coupon.UsageLimit != null && coupon.UsageCount >= coupon.UsageLimit)
                throw new AppException("Mã giảm giá đã hết lượt sử dụng");

            if (coupon.MinOrderValue != null && currentOrderValue < coupon.MinOrderValue)
                throw new AppException($"Đơn hàng phải nạp tối thiểu {coupon.MinOrderValue:N0}đ để sử dụng mã này");

            var hasUsed = await _context.CouponUsages.AnyAsync(cu => cu.UserId == userId && cu.CouponId == coupon.Id);
            if (hasUsed)
                throw new AppException("Bạn đã sử dụng mã giảm giá này rồi");

            return new CouponDto
            {
                Id = coupon.Id,
                Code = coupon.Code,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                MinOrderValue = coupon.MinOrderValue,
                MaxDiscountAmount = coupon.MaxDiscountAmount,
                StartDate = coupon.StartDate,
                EndDate = coupon.EndDate
            };
        }
    }
}
