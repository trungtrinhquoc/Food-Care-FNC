namespace FoodCare.API.Models.DTOs.Admin.Suppliers;

public class AdminSupplierDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int TotalProducts { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminSupplierDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int TotalProducts { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<SupplierProductDto> Products { get; set; } = new();
}

public class SupplierProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; }
}

public class AdminSupplierFilterDto
{
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = false;
}
