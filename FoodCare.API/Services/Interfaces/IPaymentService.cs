using FoodCare.API.Models.DTOs.Payment;

namespace FoodCare.API.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<PayOsCreateLinkResponse> CreatePayOsPaymentAsync(Guid orderId);

    
        Task HandlePayOsWebhookAsync(PayOsWebhookRequest webhook);
    }
}
