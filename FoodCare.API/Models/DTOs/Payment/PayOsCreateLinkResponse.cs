namespace FoodCare.API.Models.DTOs.Payment
{
    public class PayOsCreateLinkResponse
    {
        public string CheckoutUrl { get; set; } = default!;
        public string PaymentLinkId { get; set; } = default!;
    }
}
