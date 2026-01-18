using FoodCare.API.Models.DTOs.Profile;

namespace FoodCare.API.Services.Interfaces;

public interface IProfileService
{
    // Profile Management
    Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    
    // Address Management
    Task<List<AddressResponse>> GetAddressesAsync(Guid userId);
    Task<AddressResponse> GetAddressByIdAsync(Guid userId, Guid addressId);
    Task<AddressResponse> CreateAddressAsync(Guid userId, AddressRequest request);
    Task<AddressResponse> UpdateAddressAsync(Guid userId, Guid addressId, AddressRequest request);
    Task<bool> DeleteAddressAsync(Guid userId, Guid addressId);
    Task<bool> SetDefaultAddressAsync(Guid userId, Guid addressId);
    
    // Payment Method Management
    Task<List<PaymentMethodResponse>> GetPaymentMethodsAsync(Guid userId);
    Task<PaymentMethodResponse> GetPaymentMethodByIdAsync(Guid userId, Guid paymentMethodId);
    Task<PaymentMethodResponse> CreatePaymentMethodAsync(Guid userId, PaymentMethodRequest request);
    Task<PaymentMethodResponse> UpdatePaymentMethodAsync(Guid userId, Guid paymentMethodId, PaymentMethodRequest request);
    Task<bool> DeletePaymentMethodAsync(Guid userId, Guid paymentMethodId);
    Task<bool> SetDefaultPaymentMethodAsync(Guid userId, Guid paymentMethodId);
}
