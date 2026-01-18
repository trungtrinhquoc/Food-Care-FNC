using FoodCare.API.Models.DTOs.Orders;

namespace FoodCare.API.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderDto> CreateOrderAsync(CreateOrderDto dto);
        Task<OrderDto?> GetOrderByIdAsync(Guid id);
    }
}
