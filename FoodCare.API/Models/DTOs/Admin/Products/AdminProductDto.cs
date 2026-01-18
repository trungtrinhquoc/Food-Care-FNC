namespace FoodCare.API.Models.DTOs.Admin.Products;

public class AdminProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public int StockQuantity { get; set; }
    public int LowStockThreshold { get; set; }
    public string? Sku { get; set; }
    public string? Images { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public bool IsSubscriptionAvailable { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProductDto
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
    public int? StockQuantity { get; set; }
    public int? LowStockThreshold { get; set; }
    public string? Images { get; set; }
    public bool? IsSubscriptionAvailable { get; set; }
}

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

public class AdminProductFilterDto
{
    public string? SearchTerm { get; set; }
    public int? CategoryId { get; set; }
    public int? SupplierId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? IsActive { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = false;
}
