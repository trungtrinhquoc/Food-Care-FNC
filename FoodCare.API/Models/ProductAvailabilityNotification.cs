namespace FoodCare.API.Models;

public class ProductAvailabilityNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid ProductId { get; set; }
    public int MartId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? NotifiedAt { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}
