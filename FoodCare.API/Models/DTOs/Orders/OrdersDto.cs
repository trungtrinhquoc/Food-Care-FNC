using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.DTOs.Orders
{
    public class OrdersDto
    {
        public Guid Id { get; set; }
        public string OrderNumber => Id.ToString().Substring(0, 8).ToUpper();
        public Guid? UserId { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal MemberDiscountAmount { get; set; }
        public decimal SubscriptionDiscountAmount { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public bool IsSubscriptionOrder { get; set; }
        public string? ShippingAddressSnapshot { get; set; }
        public string? PaymentMethodSnapshot { get; set; }
        public DateTime? CreatedAt { get; set; }
        public List<OrdersItemDto> Items { get; set; } = new();
    }
}
