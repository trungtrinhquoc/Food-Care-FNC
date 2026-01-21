using FoodCare.API.Models.DTOs.Payment;

namespace FoodCare.API.Services.Interfaces
{
    public interface IPayOsService
    {
        Task<PayOsCreateLinkResponse> CreatePaymentLinkAsync(
        long orderCode,
        decimal amount,
        string description);

        bool VerifySignature(string payload, string signature);
    }
}
