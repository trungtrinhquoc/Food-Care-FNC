using System;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Payment;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;


namespace FoodCare.API.Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly FoodCareDbContext _db;
        private readonly IPayOsService _payOsService;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(FoodCareDbContext db, IPayOsService payOsService, ILogger<PaymentService> logger)
        {
            _db = db;
            _payOsService = payOsService;
            _logger = logger;
        }

        // ===============================
        // 1. Tạo link thanh toán PayOS (REAL - gọi PayOS thật)
        // ===============================
        public async Task<PayOsCreateLinkResponse> CreatePayOsPaymentAsync(Guid orderId)
        {
            _logger.LogInformation("[PaymentService] START CreatePayOsPaymentAsync - OrderId: {OrderId}", orderId);

            var order = await _db.Orders
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                _logger.LogError("[PaymentService] Order not found: {OrderId}", orderId);
                throw new Exception("Order not found");
            }

            _logger.LogInformation("[PaymentService] Order found - Status: {Status}, PaymentStatus: {PaymentStatus}, Amount: {Amount}, IsSubscription: {IsSub}",
                order.Status, order.PaymentStatus, order.TotalAmount, order.IsSubscriptionOrder);

            if (order.PaymentStatus == PaymentStatus.paid)
                throw new Exception("Order already paid");

            if (order.IsSubscriptionOrder == true)
                throw new Exception("Subscription order is not supported yet");

            // PayOS yêu cầu orderCode dạng number
            long orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            _logger.LogInformation("[PaymentService] Generated orderCode: {OrderCode}", orderCode);

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                UserId = order.UserId!.Value,
                Provider = "payos",
                TransactionType = TransactionType.Payment,
                Amount = order.TotalAmount,
                Status = TransactionStatus.Pending,
                AttemptNumber = 1,
                CreatedAt = DateTime.UtcNow
            };

            _logger.LogInformation("[PaymentService] Saving transaction to DB...");
            _db.Transaction.Add(transaction);
            await _db.SaveChangesAsync();
            _logger.LogInformation("[PaymentService] Transaction saved - Id: {TxId}", transaction.Id);

            var description = $"DH {orderCode}";
            _logger.LogInformation("[PaymentService] Calling PayOS API - amount: {Amount}, desc: {Desc}", (long)order.TotalAmount, description);

            var payOsResponse = await _payOsService.CreatePaymentLinkAsync(
                orderCode,
                order.TotalAmount,
                description
            );

            _logger.LogInformation("[PaymentService] PayOS success - checkoutUrl: {Url}", payOsResponse.CheckoutUrl);

            transaction.ProviderTransactionId = payOsResponse.PaymentLinkId;
            await _db.SaveChangesAsync();

            return payOsResponse;
        }

        // ===============================
        // 2. Xử lý webhook PayOS
        // ===============================
        public async Task HandlePayOsWebhookAsync(PayOsWebhookRequest webhook)
        {
            var data = webhook.Data;

            var transaction = await _db.Transaction
                .Include(t => t.Order)
                .FirstOrDefaultAsync(t =>
                    t.Provider == "payos" &&
                    t.ProviderTransactionId == data.PaymentLinkId);

            if (transaction == null)
                return;

            if (transaction.Status == TransactionStatus.Success)
                return;

            if (webhook.Code == "00")
            {
                transaction.Status = TransactionStatus.Success;
                transaction.PaidAt = DateTime.UtcNow;
                transaction.ProviderResponse = JsonSerializer.Serialize(webhook);

                var order = transaction.Order;
                order.PaymentStatus = PaymentStatus.paid;
                order.PaidAt = DateTime.UtcNow;
                order.Status = OrderStatus.confirmed;
            }
            else
            {
                // Backup check or failure logging
                transaction.Status = TransactionStatus.Failed;
                transaction.ProviderResponse = JsonSerializer.Serialize(webhook);
            }

            await _db.SaveChangesAsync();
        }

        // ===============================
        // 3. Xác nhận từ ReturnUrl (khi chưa deploy, webhook không gọi được)
        // ===============================
        public async Task<bool> VerifyReturnUrlAsync(string paymentLinkId, string status, long orderCode)
        {
            _logger.LogInformation("[PaymentService] VerifyReturnUrl - paymentLinkId: {Id}, status: {Status}, orderCode: {Code}",
                paymentLinkId, status, orderCode);

            // Tìm transaction theo paymentLinkId
            var transaction = await _db.Transaction
                .Include(t => t.Order)
                .FirstOrDefaultAsync(t =>
                    t.Provider == "payos" &&
                    t.ProviderTransactionId == paymentLinkId);

            // Nếu không tìm được qua paymentLinkId, thử tìm qua order (backup)
            if (transaction == null && orderCode > 0)
            {
                _logger.LogWarning("[PaymentService] Transaction not found by paymentLinkId, searching all recent pending...");
                transaction = await _db.Transaction
                    .Include(t => t.Order)
                    .Where(t => t.Provider == "payos" && t.Status == TransactionStatus.Pending)
                    .OrderByDescending(t => t.CreatedAt)
                    .FirstOrDefaultAsync();
            }

            if (transaction == null)
            {
                _logger.LogError("[PaymentService] No matching transaction found!");
                return false;
            }

            if (transaction.Status == TransactionStatus.Success)
            {
                _logger.LogInformation("[PaymentService] Transaction already marked as Success.");
                return true;
            }

            // PayOS trả status = "PAID" khi thanh toán thành công
            if (status?.ToUpper() == "PAID")
            {
                transaction.Status = TransactionStatus.Success;
                transaction.PaidAt = DateTime.UtcNow;
                transaction.ProviderResponse = $"{{\"source\":\"returnUrl\",\"status\":\"{status}\",\"paymentLinkId\":\"{paymentLinkId}\"}}";

                var order = transaction.Order;
                order.PaymentStatus = PaymentStatus.paid;
                order.PaidAt = DateTime.UtcNow;
                order.Status = OrderStatus.confirmed;

                await _db.SaveChangesAsync();

                _logger.LogInformation("[PaymentService] ✅ Order {OrderId} marked as PAID via ReturnUrl.", order.Id);
                return true;
            }
            else
            {
                transaction.Status = TransactionStatus.Failed;
                transaction.ProviderResponse = $"{{\"source\":\"returnUrl\",\"status\":\"{status}\"}}";
                await _db.SaveChangesAsync();

                _logger.LogWarning("[PaymentService] Payment NOT successful - status: {Status}", status);
                return false;
            }
        }
    }

}
