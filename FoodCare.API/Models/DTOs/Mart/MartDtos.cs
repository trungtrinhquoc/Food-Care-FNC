namespace FoodCare.API.Models.DTOs.Mart;

// ===== MART DISCOVERY DTOs =====

public class NearbyMartDto
{
    public int Id { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string? StoreLogoUrl { get; set; }
    public string? StoreBannerUrl { get; set; }
    public decimal? Rating { get; set; }
    public int ProductCount { get; set; }
    public double DistanceKm { get; set; }
    public string? Address { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string? Certifications { get; set; }
    public string? OperatingHours { get; set; }
    public string? Features { get; set; }
    public decimal? MinOrderValue { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsPreSelected { get; set; }
}

public class MartDetailDto
{
    public int Id { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string? StoreLogoUrl { get; set; }
    public string? StoreBannerUrl { get; set; }
    public decimal? Rating { get; set; }
    public int ProductCount { get; set; }
    public int? TotalOrders { get; set; }
    public int? CompletedOrders { get; set; }
    public decimal? SlaComplianceRate { get; set; }
    public string? Address { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string? Certifications { get; set; }
    public string? OperatingHours { get; set; }
    public string? Features { get; set; }
    public string? ServiceAreas { get; set; }
    public decimal? MinOrderValue { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

public class MartProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Manufacturer { get; set; }
    public string? Origin { get; set; }
    public string? Images { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public int? StockQuantity { get; set; }
    public string? StockStatus { get; set; }
    public bool? IsSubscriptionAvailable { get; set; }
    public string? SubscriptionDiscounts { get; set; }
    public decimal? RatingAverage { get; set; }
    public int? RatingCount { get; set; }
    public string? CategoryName { get; set; }
    public int? CategoryId { get; set; }
}

public class NearbyMartQueryDto
{
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public double RadiusKm { get; set; } = 3.0;
    public int MaxResults { get; set; } = 4;
}

public class MartProductFilterDto
{
    public int? CategoryId { get; set; }
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SelectMartDto
{
    public int MartId { get; set; }
}
