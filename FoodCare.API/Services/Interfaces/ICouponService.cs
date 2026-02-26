using System.Collections.Generic;
using System.Threading.Tasks;
using FoodCare.API.Models.DTOs.Coupons;

namespace FoodCare.API.Services.Interfaces
{
    public interface ICouponService
    {
        Task<CouponDto> ValidateCouponAsync(string code, decimal currentOrderValue, Guid userId);
        Task<List<CouponDto>> GetAvailableCouponsAsync(decimal currentOrderValue, Guid userId);
    }
}
