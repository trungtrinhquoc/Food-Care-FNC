using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FoodCare.API.Models.DTOs.Payment;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations
{
    public class PayOsService : IPayOsService
    {
        private readonly IConfiguration _config;

        public PayOsService(IConfiguration config)
        {
            _config = config;
        }

        public async Task<PayOsCreateLinkResponse> CreatePaymentLinkAsync(
            long orderCode,
            decimal amount,
            string description)
        {
            var clientId = _config["PayOS:ClientId"];
            var apiKey = _config["PayOS:ApiKey"];
            var checksumKey = _config["PayOS:ChecksumKey"];

            var returnUrl = _config["PayOS:ReturnUrl"];
            var cancelUrl = _config["PayOS:CancelUrl"];

            var signature = CreateSignature(
                orderCode,
                amount,
                description,
                cancelUrl,
                returnUrl,
                checksumKey
            );

            var body = new
            {
                orderCode,
                amount,
                description,
                returnUrl,
                cancelUrl,
                signature
            };

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("x-client-id", clientId);
            client.DefaultRequestHeaders.Add("x-api-key", apiKey);

            var response = await client.PostAsync(
                "https://api-merchant.payos.vn/v2/payment-requests",
                new StringContent(
                    JsonSerializer.Serialize(body),
                    Encoding.UTF8,
                    "application/json"
                )
            );

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonDocument.Parse(json)
                                   .RootElement
                                   .GetProperty("data");

            return new PayOsCreateLinkResponse
            {
                CheckoutUrl = data.GetProperty("checkoutUrl").GetString()!,
                PaymentLinkId = data.GetProperty("paymentLinkId").GetString()!
            };
        }
        public bool VerifySignature(string payload, string receivedSignature)
        {
            var checksumKey = _config["PayOS:ChecksumKey"];

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(checksumKey));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));

            var computedSignature = Convert.ToHexString(hashBytes).ToLower();

            return computedSignature == receivedSignature;
        }
        // 👇 VIẾT Ở ĐÂY
        private string CreateSignature(
            long orderCode,
            decimal amount,
            string description,
            string cancelUrl,
            string returnUrl,
            string checksumKey)
        {
            var rawData =
                $"amount={amount}&" +
                $"cancelUrl={cancelUrl}&" +
                $"description={description}&" +
                $"orderCode={orderCode}&" +
                $"returnUrl={returnUrl}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(checksumKey));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData));
            return Convert.ToHexString(hash).ToLower();
        }
    }
}
