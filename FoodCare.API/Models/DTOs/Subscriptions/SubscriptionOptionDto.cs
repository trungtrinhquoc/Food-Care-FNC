using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.DTOs.Subscriptions
{
    public class SubscriptionOptionDto
    {
        public SubFrequency Frequency { get; set; }

        // Dùng cho FE
        public string Code => Frequency.ToString().ToLower();

        public required string Label { get; set; }

        public int DiscountPercent { get; set; }
    }
}
