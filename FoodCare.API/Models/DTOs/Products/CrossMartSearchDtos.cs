namespace FoodCare.API.Models.DTOs.Products;

// ===== CROSS-MART SEARCH DTOs =====

public class CrossMartSearchDto
{
    public string Query { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public double RadiusKm { get; set; } = 3.0;
    public string? SortBy { get; set; } // price_asc, distance, popularity
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class CrossMartProductResultDto
{
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Manufacturer { get; set; }
    public string? Origin { get; set; }
    public string? Images { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public int? StockQuantity { get; set; }
    public string StockStatus { get; set; } = "Còn hàng";
    public decimal? RatingAverage { get; set; }
    public int? RatingCount { get; set; }

    // Mart info
    public int MartId { get; set; }
    public string MartName { get; set; } = string.Empty;
    public double DistanceKm { get; set; }
    public decimal? MartRating { get; set; }

    // Shipping
    public string ShippingDisplay { get; set; } = "+15.000đ";
    public bool IsFreeShipping { get; set; }
}

// ===== PRODUCT VARIANT COMPARISON DTOs =====

public class ProductVariantDto
{
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Manufacturer { get; set; }
    public string? Origin { get; set; }
    public string? Images { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? RatingAverage { get; set; }
    public int? RatingCount { get; set; }
    public bool IsPopular { get; set; }
}

// ===== ALTERNATIVE MART DTOs =====

public class AlternativeMartDto
{
    public int MartId { get; set; }
    public string MartName { get; set; } = string.Empty;
    public double DistanceKm { get; set; }
    public decimal ProductPrice { get; set; }
    public int? StockQuantity { get; set; }
    public string StockStatus { get; set; } = "Còn hàng";
    public decimal? MartRating { get; set; }
}
