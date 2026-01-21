using FoodCare.API.Models.DTOs.Payment;
using FoodCare.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;


namespace FoodCare.API.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IPayOsService _payOsService;

        public PaymentController(
            IPaymentService paymentService,
            IPayOsService payOsService)
        {
            _paymentService = paymentService;
            _payOsService = payOsService;
        }

        // ======================================
        // 1. TẠO LINK THANH TOÁN PAYOS (ORDER)
        // ======================================
        /// <summary>
        /// Tạo link thanh toán PayOS cho order thường
        /// </summary>
        [HttpPost("payos/create")]
        public async Task<IActionResult> CreatePayOsPayment(
            [FromBody] CreatePaymentRequest request)
        {
            if (request == null || request.OrderId == Guid.Empty)
                return BadRequest("Invalid order id");

            var result = await _paymentService.CreatePayOsPaymentAsync(request.OrderId);

            return Ok(result);
        }

        // ======================================
        // 2. WEBHOOK PAYOS
        // ======================================
        /// <summary>
        /// Webhook PayOS gửi kết quả thanh toán
        /// </summary>
        [HttpPost("payos/webhook")]
        public async Task<IActionResult> PayOsWebhook()
        {
            // 1. Đọc raw body (BẮT BUỘC)
            using var reader = new StreamReader(Request.Body);
            var payload = await reader.ReadToEndAsync();

            // 2. Lấy signature từ header
            var signature = Request.Headers["x-signature"].FirstOrDefault();
            if (string.IsNullOrEmpty(signature))
                return Unauthorized();

            // 3. Verify chữ ký
            var isValid = _payOsService.VerifySignature(payload, signature);
            if (!isValid)
                return Unauthorized();

            // 4. Parse JSON sau khi verify
            var webhook = JsonSerializer.Deserialize<PayOsWebhookRequest>(payload);
            if (webhook == null)
                return BadRequest();

            // 5. Xử lý nghiệp vụ
            await _paymentService.HandlePayOsWebhookAsync(webhook);

            return Ok();
        }
    }
}
