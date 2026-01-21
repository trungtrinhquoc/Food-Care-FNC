using System.Text.Json.Serialization;

namespace FoodCare.API.Models.DTOs.Payment
{
    public class PayOsWebhookRequest
    {

        [JsonPropertyName("code")]
        public string Code { get; set; } = default!;

        [JsonPropertyName("desc")]
        public string Desc { get; set; } = default!;

        [JsonPropertyName("data")]
        public PayOsWebhookData Data { get; set; } = default!;

    }

    public class PayOsWebhookData
    {
        [JsonPropertyName("orderCode")]
        public long OrderCode { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = default!; // PAID / CANCELLED / FAILED

        [JsonPropertyName("paymentLinkId")]
        public string PaymentLinkId { get; set; } = default!;

        [JsonPropertyName("description")]
        public string Description { get; set; } = default!;
    }
}
