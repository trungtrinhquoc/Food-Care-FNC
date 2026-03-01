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
                return BadRequest(new { message = "Invalid order id" });

            try
            {
                var result = await _paymentService.CreatePayOsPaymentAsync(request.OrderId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PayOS] ❌ EXCEPTION: {ex.GetType().Name}: {ex.Message}");
                Console.WriteLine($"[PayOS] StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                    Console.WriteLine($"[PayOS] InnerException: {ex.InnerException.Message}");
                return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        // ======================================
        // 2. XÁC NHẬN TỪ RETURNURL (thay thế webhook khi test local)
        // ======================================
        /// <summary>
        /// PayOS redirect về đây sau khi thanh toán.
        /// Query params: id (paymentLinkId), status (PAID/CANCELLED), orderCode, cancel (true/false)
        /// </summary>
        [HttpGet("payos/verify-return")]
        public async Task<IActionResult> VerifyReturn(
            [FromQuery] string? id,
            [FromQuery] string? status,
            [FromQuery] long orderCode = 0,
            [FromQuery] bool cancel = false)
        {
            Console.WriteLine($"[PayOS VerifyReturn] id={id}, status={status}, orderCode={orderCode}, cancel={cancel}");

            var feSuccessUrl = "http://localhost:5173/payment/success";
            var feCancelUrl  = "http://localhost:5173/payment/cancel";

            if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(status))
                return Redirect(feCancelUrl);

            try
            {
                var effectiveStatus = cancel ? "CANCELLED" : status;
                var isPaid = await _paymentService.VerifyReturnUrlAsync(id, effectiveStatus!, orderCode);

                if (isPaid)
                    return Redirect($"{feSuccessUrl}?orderCode={orderCode}");
                else
                    return Redirect($"{feCancelUrl}?reason={effectiveStatus}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PayOS VerifyReturn] ERROR: {ex.Message}");
                return Redirect(feCancelUrl);
            }
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
            try
            {
                // 1. Đọc raw body (BẮT BUỘC)
                using var reader = new StreamReader(Request.Body);
                var payload = await reader.ReadToEndAsync();

                // 2. Lấy signature từ header
                var signature = Request.Headers["x-signature"].FirstOrDefault();

                Console.WriteLine($"[Webhook] Received at {DateTime.Now}: Length={payload.Length}");
                Console.WriteLine($"[Webhook] Signature: {signature}");

                // ⚠️ BYPASS SIGNATURE FOR TESTING - BỎ QUA KIỂM TRA CHỮ KÝ KHI TEST
                // TODO: Bật lại bảo mật sau khi deploy xong
                /*
                if (string.IsNullOrEmpty(signature))
                {
                    Console.WriteLine("[Webhook] Error: Missing signature header");
                    return Unauthorized();
                }

                var isValid = _payOsService.VerifySignature(payload, signature);
                if (!isValid)
                {
                    Console.WriteLine("[Webhook] Error: Invalid signature");
                    return Unauthorized();
                }
                */
                Console.WriteLine("[Webhook] ⚠️ Signature verification BYPASSED for testing");

                // 3. Parse JSON
                var webhook = JsonSerializer.Deserialize<PayOsWebhookRequest>(payload);
                if (webhook == null)
                {
                    Console.WriteLine("[Webhook] Error: Failed to deserialize JSON");
                    return BadRequest();
                }

                // 4. Xử lý nghiệp vụ
                Console.WriteLine($"[Webhook] Processing Order... PaymentLinkId: {webhook.Data?.PaymentLinkId}, Status: {webhook.Data?.Status}");
                await _paymentService.HandlePayOsWebhookAsync(webhook);

                return Ok(new { message = "Webhook processed successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Webhook] CRITICAL EXCEPTION: {ex}");
                return Ok();
            }
        }
    }
}
