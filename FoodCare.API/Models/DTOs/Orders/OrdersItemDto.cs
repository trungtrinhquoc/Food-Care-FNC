namespace FoodCare.API.Models.DTOs.Orders
{
    public class OrdersItemDto
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public bool IsSubscription { get; set; }
        public string? SubscriptionFrequency { get; set; }
    }
}
