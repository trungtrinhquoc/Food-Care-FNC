using FoodCare.API.Models.DTOs.Cart;

namespace FoodCare.API.Services.Interfaces;

public interface ICartService
{
    Task<CartDto> GetCartAsync(Guid userId);
    Task<CartItemDto> AddToCartAsync(Guid userId, AddToCartDto dto);
    Task<CartItemDto?> UpdateCartItemAsync(Guid userId, Guid cartItemId, UpdateCartItemDto dto);
    Task<bool> RemoveCartItemAsync(Guid userId, Guid cartItemId);
    Task<bool> ClearCartAsync(Guid userId);
    Task<CartCheckoutResultDto> CheckoutFromCartAsync(Guid userId);
}
