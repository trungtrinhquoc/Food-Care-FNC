using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Profile;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations;

public class ProfileService : IProfileService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<ProfileService> _logger;
    private readonly Supabase.Client _supabaseClient;

    public ProfileService(
        FoodCareDbContext context,
        ILogger<ProfileService> logger,
        Supabase.Client supabaseClient)
    {
        _context = context;
        _logger = logger;
        _supabaseClient = supabaseClient;
    }

    #region Profile Management

    public async Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        user.FullName = request.FullName;
        user.PhoneNumber = request.PhoneNumber;
        user.AvatarUrl = request.AvatarUrl;
        user.UpdatedAt = DateTime.UtcNow;

        // Note: Email update requires Supabase Auth update
        if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
        {
            // Update email in Supabase Auth
            try
            {
                var attributes = new Supabase.Gotrue.UserAttributes
                {
                    Email = request.Email
                };
                await _supabaseClient.Auth.Update(attributes);
                user.Email = request.Email;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update email in Supabase Auth");
                throw new InvalidOperationException("Failed to update email. Please try again later.");
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Profile updated for user {UserId}", userId);
        return true;
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        try
        {
            // Verify current password by attempting to sign in
            var session = await _supabaseClient.Auth.SignIn(user.Email, request.CurrentPassword);
            if (session?.User == null)
            {
                throw new UnauthorizedAccessException("Current password is incorrect");
            }

            // Update password in Supabase Auth
            var attributes = new Supabase.Gotrue.UserAttributes
            {
                Password = request.NewPassword
            };
            await _supabaseClient.Auth.Update(attributes);

            _logger.LogInformation("Password changed successfully for user {UserId}", userId);
            return true;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to change password for user {UserId}", userId);
            throw new InvalidOperationException("Failed to change password. Please try again later.");
        }
    }

    #endregion

    #region Address Management

    public async Task<List<AddressResponse>> GetAddressesAsync(Guid userId)
    {
        var addresses = await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .Select(a => new AddressResponse
            {
                Id = a.Id,
                RecipientName = a.RecipientName,
                PhoneNumber = a.PhoneNumber,
                AddressLine1 = a.AddressLine1,
                AddressLine2 = a.AddressLine2,
                City = a.City,
                District = a.District,
                Ward = a.Ward,
                IsDefault = a.IsDefault ?? false,
                CreatedAt = a.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return addresses;
    }

    public async Task<AddressResponse> GetAddressByIdAsync(Guid userId, Guid addressId)
    {
        var address = await _context.Addresses
            .Where(a => a.Id == addressId && a.UserId == userId)
            .Select(a => new AddressResponse
            {
                Id = a.Id,
                RecipientName = a.RecipientName,
                PhoneNumber = a.PhoneNumber,
                AddressLine1 = a.AddressLine1,
                AddressLine2 = a.AddressLine2,
                City = a.City,
                District = a.District,
                Ward = a.Ward,
                IsDefault = a.IsDefault ?? false,
                CreatedAt = a.CreatedAt ?? DateTime.UtcNow
            })
            .FirstOrDefaultAsync();

        if (address == null)
        {
            throw new KeyNotFoundException("Address not found");
        }

        return address;
    }

    public async Task<AddressResponse> CreateAddressAsync(Guid userId, AddressRequest request)
    {
        // If this is set as default, unset other defaults
        if (request.IsDefault)
        {
            await UnsetDefaultAddressesAsync(userId);
        }

        var address = new Address
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RecipientName = request.RecipientName,
            PhoneNumber = request.PhoneNumber,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            District = request.District,
            Ward = request.Ward,
            IsDefault = request.IsDefault,
            CreatedAt = DateTime.UtcNow
        };

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Address created for user {UserId}", userId);

        return new AddressResponse
        {
            Id = address.Id,
            RecipientName = address.RecipientName,
            PhoneNumber = address.PhoneNumber,
            AddressLine1 = address.AddressLine1,
            AddressLine2 = address.AddressLine2,
            City = address.City,
            District = address.District,
            Ward = address.Ward,
            IsDefault = address.IsDefault ?? false,
            CreatedAt = address.CreatedAt ?? DateTime.UtcNow
        };
    }

    public async Task<AddressResponse> UpdateAddressAsync(Guid userId, Guid addressId, AddressRequest request)
    {
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
        {
            throw new KeyNotFoundException("Address not found");
        }

        // If this is set as default, unset other defaults
        if (request.IsDefault && address.IsDefault != true)
        {
            await UnsetDefaultAddressesAsync(userId);
        }

        address.RecipientName = request.RecipientName;
        address.PhoneNumber = request.PhoneNumber;
        address.AddressLine1 = request.AddressLine1;
        address.AddressLine2 = request.AddressLine2;
        address.City = request.City;
        address.District = request.District;
        address.Ward = request.Ward;
        address.IsDefault = request.IsDefault;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Address {AddressId} updated for user {UserId}", addressId, userId);

        return new AddressResponse
        {
            Id = address.Id,
            RecipientName = address.RecipientName,
            PhoneNumber = address.PhoneNumber,
            AddressLine1 = address.AddressLine1,
            AddressLine2 = address.AddressLine2,
            City = address.City,
            District = address.District,
            Ward = address.Ward,
            IsDefault = address.IsDefault ?? false,
            CreatedAt = address.CreatedAt ?? DateTime.UtcNow
        };
    }

    public async Task<bool> DeleteAddressAsync(Guid userId, Guid addressId)
    {
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
        {
            throw new KeyNotFoundException("Address not found");
        }

        // Don't allow deleting default address if there are other addresses
        if (address.IsDefault == true)
        {
            var otherAddressesCount = await _context.Addresses
                .CountAsync(a => a.UserId == userId && a.Id != addressId);

            if (otherAddressesCount > 0)
            {
                throw new InvalidOperationException("Cannot delete default address. Please set another address as default first.");
            }
        }

        _context.Addresses.Remove(address);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Address {AddressId} deleted for user {UserId}", addressId, userId);
        return true;
    }

    public async Task<bool> SetDefaultAddressAsync(Guid userId, Guid addressId)
    {
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
        {
            throw new KeyNotFoundException("Address not found");
        }

        // Unset all other defaults
        await UnsetDefaultAddressesAsync(userId);

        // Set this as default
        address.IsDefault = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Address {AddressId} set as default for user {UserId}", addressId, userId);
        return true;
    }

    private async Task UnsetDefaultAddressesAsync(Guid userId)
    {
        var defaultAddresses = await _context.Addresses
            .Where(a => a.UserId == userId && a.IsDefault == true)
            .ToListAsync();

        foreach (var addr in defaultAddresses)
        {
            addr.IsDefault = false;
        }

        if (defaultAddresses.Any())
        {
            await _context.SaveChangesAsync();
        }
    }

    #endregion

    #region Payment Method Management

    public async Task<List<PaymentMethodResponse>> GetPaymentMethodsAsync(Guid userId)
    {
        var paymentMethods = await _context.PaymentMethods
            .Where(pm => pm.UserId == userId)
            .OrderByDescending(pm => pm.IsDefault)
            .ThenByDescending(pm => pm.CreatedAt)
            .Select(pm => new PaymentMethodResponse
            {
                Id = pm.Id,
                Provider = pm.Provider,
                Last4Digits = pm.Last4Digits,
                ExpiryDate = pm.ExpiryDate,
                IsDefault = pm.IsDefault ?? false,
                CreatedAt = pm.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return paymentMethods;
    }

    public async Task<PaymentMethodResponse> GetPaymentMethodByIdAsync(Guid userId, Guid paymentMethodId)
    {
        var paymentMethod = await _context.PaymentMethods
            .Where(pm => pm.Id == paymentMethodId && pm.UserId == userId)
            .Select(pm => new PaymentMethodResponse
            {
                Id = pm.Id,
                Provider = pm.Provider,
                Last4Digits = pm.Last4Digits,
                ExpiryDate = pm.ExpiryDate,
                IsDefault = pm.IsDefault ?? false,
                CreatedAt = pm.CreatedAt ?? DateTime.UtcNow
            })
            .FirstOrDefaultAsync();

        if (paymentMethod == null)
        {
            throw new KeyNotFoundException("Payment method not found");
        }

        return paymentMethod;
    }

    public async Task<PaymentMethodResponse> CreatePaymentMethodAsync(Guid userId, PaymentMethodRequest request)
    {
        // If this is set as default, unset other defaults
        if (request.IsDefault)
        {
            await UnsetDefaultPaymentMethodsAsync(userId);
        }

        var paymentMethod = new PaymentMethod
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Provider = request.Provider,
            ProviderToken = request.ProviderToken,
            Last4Digits = request.Last4Digits,
            ExpiryDate = request.ExpiryDate,
            IsDefault = request.IsDefault,
            CreatedAt = DateTime.UtcNow
        };

        _context.PaymentMethods.Add(paymentMethod);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment method created for user {UserId}", userId);

        return new PaymentMethodResponse
        {
            Id = paymentMethod.Id,
            Provider = paymentMethod.Provider,
            Last4Digits = paymentMethod.Last4Digits,
            ExpiryDate = paymentMethod.ExpiryDate,
            IsDefault = paymentMethod.IsDefault ?? false,
            CreatedAt = paymentMethod.CreatedAt ?? DateTime.UtcNow
        };
    }

    public async Task<PaymentMethodResponse> UpdatePaymentMethodAsync(Guid userId, Guid paymentMethodId, PaymentMethodRequest request)
    {
        var paymentMethod = await _context.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.Id == paymentMethodId && pm.UserId == userId);

        if (paymentMethod == null)
        {
            throw new KeyNotFoundException("Payment method not found");
        }

        // If this is set as default, unset other defaults
        if (request.IsDefault && paymentMethod.IsDefault != true)
        {
            await UnsetDefaultPaymentMethodsAsync(userId);
        }

        paymentMethod.Provider = request.Provider;
        paymentMethod.ProviderToken = request.ProviderToken;
        paymentMethod.Last4Digits = request.Last4Digits;
        paymentMethod.ExpiryDate = request.ExpiryDate;
        paymentMethod.IsDefault = request.IsDefault;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment method {PaymentMethodId} updated for user {UserId}", paymentMethodId, userId);

        return new PaymentMethodResponse
        {
            Id = paymentMethod.Id,
            Provider = paymentMethod.Provider,
            Last4Digits = paymentMethod.Last4Digits,
            ExpiryDate = paymentMethod.ExpiryDate,
            IsDefault = paymentMethod.IsDefault ?? false,
            CreatedAt = paymentMethod.CreatedAt ?? DateTime.UtcNow
        };
    }

    public async Task<bool> DeletePaymentMethodAsync(Guid userId, Guid paymentMethodId)
    {
        var paymentMethod = await _context.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.Id == paymentMethodId && pm.UserId == userId);

        if (paymentMethod == null)
        {
            throw new KeyNotFoundException("Payment method not found");
        }

        // Don't allow deleting default payment method if there are other methods
        if (paymentMethod.IsDefault == true)
        {
            var otherMethodsCount = await _context.PaymentMethods
                .CountAsync(pm => pm.UserId == userId && pm.Id != paymentMethodId);

            if (otherMethodsCount > 0)
            {
                throw new InvalidOperationException("Cannot delete default payment method. Please set another method as default first.");
            }
        }

        _context.PaymentMethods.Remove(paymentMethod);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment method {PaymentMethodId} deleted for user {UserId}", paymentMethodId, userId);
        return true;
    }

    public async Task<bool> SetDefaultPaymentMethodAsync(Guid userId, Guid paymentMethodId)
    {
        var paymentMethod = await _context.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.Id == paymentMethodId && pm.UserId == userId);

        if (paymentMethod == null)
        {
            throw new KeyNotFoundException("Payment method not found");
        }

        // Unset all other defaults
        await UnsetDefaultPaymentMethodsAsync(userId);

        // Set this as default
        paymentMethod.IsDefault = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment method {PaymentMethodId} set as default for user {UserId}", paymentMethodId, userId);
        return true;
    }

    private async Task UnsetDefaultPaymentMethodsAsync(Guid userId)
    {
        var defaultMethods = await _context.PaymentMethods
            .Where(pm => pm.UserId == userId && pm.IsDefault == true)
            .ToListAsync();

        foreach (var method in defaultMethods)
        {
            method.IsDefault = false;
        }

        if (defaultMethods.Any())
        {
            await _context.SaveChangesAsync();
        }
    }

    #endregion
}
