namespace FoodCare.API.Models.DTOs.Cart;

public class CartDto
{
    public List<CartItemDto> SubscriptionItems { get; set; } = new();
    public List<CartItemDto> OneTimeItems { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal TotalAmount { get; set; }
    public bool IsFreeShipping { get; set; }
    public string ShippingNote { get; set; } = string.Empty;
    public int? MartId { get; set; }
    public string? MartName { get; set; }
    public decimal WalletBalance { get; set; }
    public decimal WalletAfterPayment { get; set; }
    public bool HasSufficientBalance { get; set; }
}

public class CartItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public bool IsSubscription { get; set; }
    public string? SubscriptionFrequency { get; set; }
    public bool IsInActiveSubscription { get; set; }
    public string? StockStatus { get; set; }
}

public class AddToCartDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; } = 1;
    public bool IsSubscription { get; set; }
    public string? SubscriptionFrequency { get; set; }
}

public class UpdateCartItemDto
{
    public int Quantity { get; set; }
}

public class CartCheckoutResultDto
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal WalletBalanceBefore { get; set; }
    public decimal WalletBalanceAfter { get; set; }
}
