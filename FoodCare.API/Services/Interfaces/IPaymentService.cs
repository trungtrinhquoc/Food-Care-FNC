using FoodCare.API.Models.DTOs.Payment;

namespace FoodCare.API.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<PayOsCreateLinkResponse> CreatePayOsPaymentAsync(Guid orderId);
        Task HandlePayOsWebhookAsync(PayOsWebhookRequest webhook);

        /// <summary>
        /// Xác nhận thanh toán từ query params khi PayOS redirect về ReturnUrl.
        /// Dùng khi webhook không reach được (localhost / chưa deploy).
        /// </summary>
        Task<bool> VerifyReturnUrlAsync(string paymentLinkId, string status, long orderCode);
    }
}
