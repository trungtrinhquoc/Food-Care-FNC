using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.DTOs.Subscriptions
{
    public class SubscriptionDto
    {
        public Guid Id { get; set; }

        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = null!;

        public SubFrequency Frequency { get; set; }
        public int Quantity { get; set; }

        public decimal DiscountPercent { get; set; }

        public SubStatus Status { get; set; }

        public DateOnly NextDeliveryDate { get; set; }
        public DateOnly? PauseUntil { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}

