using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.DTOs.Orders
{
    public class OrderDto
    {
        public Guid Id { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public DateTime? CreatedAt { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
    }
}
