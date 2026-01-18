namespace FoodCare.API.Models.DTOs.Orders
{
    public class CreateOrderItemDto
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public object? VariantSnapshot { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}
