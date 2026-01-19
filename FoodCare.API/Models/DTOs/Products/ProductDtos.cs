using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;

namespace FoodCare.API.Models.DTOs.Products;

// ===== RESPONSE DTOs =====
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
    public string? ImageUrl { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public decimal? RatingAverage { get; set; }
    public int? RatingCount { get; set; }
    public bool? IsSubscriptionAvailable { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
}

// ===== FILTER DTO =====
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

// ===== CATEGORY DTO =====
public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int? ParentId { get; set; }
}

[Authorize("admin")]

public class CreateProductDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    
    [Required]
    [Range(0, double.MaxValue)]
    public decimal BasePrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal? CostPrice { get; set; }
    
    public int? CategoryId { get; set; }
    public int? SupplierId { get; set; }
    public string? Sku { get; set; }
    public int? StockQuantity { get; set; }
    public int? LowStockThreshold { get; set; }
    public string? Images { get; set; }
    public bool? IsSubscriptionAvailable { get; set; }
}

[Authorize("admin")]
public class UpdateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public int? CategoryId { get; set; }
    public int? SupplierId { get; set; }
    public string? Sku { get; set; }
    public string? Images { get; set; }
    public bool? IsSubscriptionAvailable { get; set; }
    public bool? IsActive { get; set; }
}
