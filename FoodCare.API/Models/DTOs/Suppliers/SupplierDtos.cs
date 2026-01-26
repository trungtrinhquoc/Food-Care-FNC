using System.ComponentModel.DataAnnotations;

namespace FoodCare.API.Models.DTOs.Suppliers;

// ===== RESPONSE DTOs =====
public class SupplierDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? ContactPerson { get; set; }
    public string? TaxCode { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ProductCount { get; set; }
}

// ===== REQUEST DTOs =====
public class CreateSupplierDto
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = null!;

    [EmailAddress]
    [StringLength(200)]
    public string? ContactEmail { get; set; }

    [StringLength(50)]
    public string? Phone { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(200)]
    public string? ContactPerson { get; set; }

    [StringLength(100)]
    public string? TaxCode { get; set; }

    public bool IsActive { get; set; } = true;

    public string? UserId { get; set; }
}

public class UpdateSupplierDto
{
    [StringLength(200)]
    public string? Name { get; set; }

    [EmailAddress]
    [StringLength(200)]
    public string? ContactEmail { get; set; }

    [StringLength(50)]
    public string? Phone { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(200)]
    public string? ContactPerson { get; set; }

    [StringLength(100)]
    public string? TaxCode { get; set; }

    public bool? IsActive { get; set; }

    public string? UserId { get; set; }
}

// ===== FILTER DTO =====
public class SupplierFilterDto
{
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; } // name, createdAt, productCount
    public bool SortDescending { get; set; } = false;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

// ===== SUPPLIER ROLE DTOs =====
public class SupplierProfileDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? ContactPerson { get; set; }
    public string? TaxCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ProductCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
}

public class SupplierProductDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int OrderCount { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class SupplierOrderDto
{
    public string Id { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = null!;
    public string CustomerName { get; set; } = null!;
    public int ItemCount { get; set; }
}

public class SupplierStatsDto
{
    public int TotalProducts { get; set; }
    public int ActiveProducts { get; set; }
    public int LowStockProducts { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal ThisMonthRevenue { get; set; }
    public decimal LastMonthRevenue { get; set; }
}
