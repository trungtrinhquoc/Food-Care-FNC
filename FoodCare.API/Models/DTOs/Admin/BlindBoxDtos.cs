namespace FoodCare.API.Models.DTOs.Admin;

public class BlindBoxDto
{
    public Guid Id { get; set; }
    public int SupplierId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal OriginalValue { get; set; }
    public decimal BlindBoxPrice { get; set; }
    public int Quantity { get; set; }
    public int QuantitySold { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string? Contents { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    // computed
    public int DaysUntilExpiry { get; set; }
    public int QuantityAvailable { get; set; }
}

public class BlindBoxListResult
{
    public List<BlindBoxDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class ApproveBlindBoxDto
{
    public decimal? AdjustedPrice { get; set; }
}

public class RejectBlindBoxDto
{
    public string Reason { get; set; } = string.Empty;
}
