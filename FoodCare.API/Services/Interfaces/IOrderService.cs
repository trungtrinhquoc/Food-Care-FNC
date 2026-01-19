using FoodCare.API.Models.DTOs.Orders;

namespace FoodCare.API.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrdersDto> CreateOrderAsync(CreateOrderDto dto);
        Task<OrdersDto?> GetOrderByIdAsync(Guid id);
    }
}
