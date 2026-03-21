using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodCare.API.Models;

public class CartItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public Guid ProductId { get; set; }

    public int Quantity { get; set; } = 1;

    public bool IsSubscription { get; set; }

    [MaxLength(20)]
    public string? SubscriptionFrequency { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}
