namespace FoodCare.API.Models.DTOs.Orders
{
    public class CreateOrderDto
    {
        public Guid? UserId { get; set; }

        public string ShippingAddress { get; set; } = null!;
        public string? RecipientName { get; set; }
        public string? PhoneNumber { get; set; }
        public string PaymentMethod { get; set; } = null!;

        public string? Note { get; set; }

        public List<CreateOrderItemDto> Items { get; set; } = new();
    }
}
