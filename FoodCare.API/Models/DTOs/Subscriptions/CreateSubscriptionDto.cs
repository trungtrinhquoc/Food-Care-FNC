using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.DTOs.Subscriptions
{
    public class CreateSubscriptionDto
    {
        public Guid ProductId { get; set; }
        public SubFrequency Frequency { get; set; }
        public int Quantity { get; set; }

        // Giảm giá theo loại subscription
        public decimal DiscountPercent { get; set; }

        // Tuỳ chọn – mở rộng sau này
        public Guid? PaymentMethodId { get; set; }
        public Guid? ShippingAddressId { get; set; }

        // Ngày bắt đầu subscription
        // Nếu null → backend tự set DateOnly.FromDateTime(DateTime.UtcNow)
        public DateOnly? StartDate { get; set; }
    }
}
