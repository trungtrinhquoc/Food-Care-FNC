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
        private readonly ILogger<PayOsService> _logger;

        public PayOsService(IConfiguration config, ILogger<PayOsService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task<PayOsCreateLinkResponse> CreatePaymentLinkAsync(
            long orderCode,
            decimal amount,
            string description)
        {
            var clientId = _config["PaymentSettings:PayOS:ClientId"];
            var apiKey = _config["PaymentSettings:PayOS:ApiKey"];
            var checksumKey = _config["PaymentSettings:PayOS:ChecksumKey"];

            var returnUrl = _config["PaymentSettings:PayOS:ReturnUrl"];
            var cancelUrl = _config["PaymentSettings:PayOS:CancelUrl"];

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

            var json = await response.Content.ReadAsStringAsync();
            _logger.LogInformation($"PayOS Response: {json}");

            response.EnsureSuccessStatusCode();

            var root = JsonDocument.Parse(json).RootElement;
            var code = root.GetProperty("code").GetString();
            var desc = root.GetProperty("desc").GetString();

            if (code != "00")
            {
                _logger.LogError($"PayOS Error: Code={code}, Desc={desc}");
                throw new Exception($"PayOS Error: {desc}");
            }

            var data = root.GetProperty("data");

            if (data.ValueKind == JsonValueKind.Null)
            {
                 throw new Exception("PayOS returned success but 'data' is null.");
            }

            return new PayOsCreateLinkResponse
            {
                CheckoutUrl = data.GetProperty("checkoutUrl").GetString()!,
                PaymentLinkId = data.GetProperty("paymentLinkId").GetString()!
            };
        }
        public bool VerifySignature(string payload, string receivedSignature)
        {
            var checksumKey = _config["PaymentSettings:PayOS:ChecksumKey"];

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
            // PayOS yêu cầu sắp xếp a-z
            // amount, cancelUrl, description, orderCode, returnUrl
            
            // NOTE: amount phải là số nguyên (nếu VND), không có decimal point trong chuỗi ký
            var amountStr = ((long)amount).ToString();

            var rawData =
                $"amount={amountStr}&" +
                $"cancelUrl={cancelUrl}&" +
                $"description={description}&" +
                $"orderCode={orderCode}&" +
                $"returnUrl={returnUrl}";
            
            _logger.LogInformation($"Signature Raw Data: {rawData}");

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(checksumKey));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData));
            return Convert.ToHexString(hash).ToLower();
        }
    }
}
