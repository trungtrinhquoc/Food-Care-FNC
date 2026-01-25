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

        public PaymentService(FoodCareDbContext db, IPayOsService payOsService)
        {
            _db = db;
            _payOsService = payOsService;
        }

        // ===============================
        // 1. Tạo link thanh toán PayOS
        // ===============================
        public async Task<PayOsCreateLinkResponse> CreatePayOsPaymentAsync(Guid orderId)
        {
            var order = await _db.Orders
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                throw new Exception("Order not found");

            if (order.PaymentStatus == PaymentStatus.paid)
                throw new Exception("Order already paid");

            if (order.IsSubscriptionOrder == true)
                throw new Exception("Subscription order is not supported yet");

            // PayOS yêu cầu orderCode dạng number
            long orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

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

            _db.Transaction.Add(transaction);
            await _db.SaveChangesAsync();

            var description = $"DH {orderCode}";
            // PayOS limit 25 chars. "DH " (3) + orderCode (13) = 16 chars -> OK

            var payOsResponse = await _payOsService.CreatePaymentLinkAsync(
                orderCode,
                order.TotalAmount,
                description
            );

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

            if (data.Status == "PAID")
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
                transaction.Status = TransactionStatus.Failed;
                transaction.ProviderResponse = JsonSerializer.Serialize(webhook);
            }

            await _db.SaveChangesAsync();
        }
    }

}
