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

public class AdminUpsertSupplierDto
{
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? ContactPerson { get; set; }
    public string? TaxCode { get; set; }
    public string? BankAccount { get; set; }
    public string? BankName { get; set; }
    public decimal? CommissionRate { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? UserId { get; set; }
    public string? AccountEmail { get; set; }
    public string? AccountPassword { get; set; }
}

public class MartSummaryDto
{
    public int Id { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public decimal Rating { get; set; }
    public decimal SlaComplianceRate { get; set; }
    public int MonthlyOrders { get; set; }
    public bool IsTop { get; set; }
    public bool HasSlaWarning { get; set; }
    public bool IsActive { get; set; }
}

