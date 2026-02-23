using FoodCare.API.Models.DTOs.Products;

namespace FoodCare.API.Models.DTOs.Recommendations;

public class LowStockNotificationDto
{
    public ProductDto Product { get; set; } = null!;
    
    public DateTime LastPurchaseDate { get; set; }
    
    public int EstimatedDaysLeft { get; set; }
    
    public int AverageUsageDays { get; set; }
    
    public int PurchaseCount { get; set; }
}
