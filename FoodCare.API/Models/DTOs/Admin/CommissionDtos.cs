namespace FoodCare.API.Models.DTOs.Admin;

// ── Policy DTOs ──────────────────────────────────────────────────────────────

/// <summary>Read DTO for a commission policy record.</summary>
public class CommissionPolicyDto
{
    public int Id { get; set; }
    /// <summary>Null = global platform default.</summary>
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public int? CategoryId { get; set; }
    public decimal CommissionRate { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>Request body for creating/updating a commission policy.</summary>
public class SetCommissionRateRequest
{
    /// <summary>Rate as a percentage, must be between 0 and 100.</summary>
    public decimal Rate { get; set; }
    public string? Description { get; set; }
    /// <summary>Defaults to today if omitted.</summary>
    public DateOnly? EffectiveFrom { get; set; }
}

// ── Per-order Commission DTOs ─────────────────────────────────────────────────

/// <summary>Read DTO for a single order commission record.</summary>
public class OrderCommissionDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public decimal OrderAmount { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal SupplierAmount { get; set; }
    /// <summary>pending | settled | refunded</summary>
    public string Status { get; set; } = "pending";
    public Guid? SettlementId { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ── Report DTOs ───────────────────────────────────────────────────────────────

/// <summary>Aggregated commission report for a period.</summary>
public class CommissionReportDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal TotalOrderAmount { get; set; }
    public decimal TotalCommissionAmount { get; set; }
    public decimal TotalSupplierAmount { get; set; }
    public int TotalOrderCount { get; set; }
    public int PendingCount { get; set; }
    public int SettledCount { get; set; }
    public int RefundedCount { get; set; }
    public List<CommissionBySupplierDto> BySupplier { get; set; } = [];
}

/// <summary>Per-supplier breakdown within a commission report.</summary>
public class CommissionBySupplierDto
{
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public decimal EffectiveRate { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalCommission { get; set; }
    public decimal TotalDue { get; set; }
    public int OrderCount { get; set; }
    public int PendingCount { get; set; }
    public int SettledCount { get; set; }
}
