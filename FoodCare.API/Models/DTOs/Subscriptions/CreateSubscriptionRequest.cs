using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.DTOs.Subscriptions
{
    public class CreateSubscriptionRequest
    {
        public Guid ProductId { get; set; }
        public SubFrequency Frequency { get; set; }
        public int Quantity { get; set; }
        public Guid ShippingAddressId { get; set; }
        public Guid PaymentMethodId { get; set; }
    }
}
