using System.ComponentModel.DataAnnotations;

namespace FoodCare.API.Models.DTOs.Products;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public string? Sku { get; set; }
    public int? StockQuantity { get; set; }
    public string? ImageUrl { get; set; } // Derived from first image in Images JSON
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public decimal? RatingAverage { get; set; }
    public int? RatingCount { get; set; }
    public bool? IsSubscriptionAvailable { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class CreateProductDto
{
    [Required]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal BasePrice { get; set; }

    public decimal? OriginalPrice { get; set; }

    public string? Sku { get; set; }

    public int StockQuantity { get; set; }

    public int? CategoryId { get; set; }

    public int? SupplierId { get; set; }
    
    public bool IsSubscriptionAvailable { get; set; } = false;
    
    public List<string>? Images { get; set; }
}

public class UpdateProductDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? BasePrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public string? Sku { get; set; }
    public int? StockQuantity { get; set; }
    public int? CategoryId { get; set; }
    public bool? IsSubscriptionAvailable { get; set; }
    public bool? IsActive { get; set; }
    public List<string>? Images { get; set; }
}

public class ProductFilterDto
{
    public int? CategoryId { get; set; }
    public string? SearchTerm { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? IsSubscriptionAvailable { get; set; }
    public string? SortBy { get; set; } // price_asc, price_desc, name, rating, newest
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int? ParentId { get; set; }
}
