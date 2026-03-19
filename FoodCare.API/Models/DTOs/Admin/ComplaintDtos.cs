namespace FoodCare.API.Models.DTOs.Admin;

public class ComplaintDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public string? AdminNote { get; set; }
    public decimal? RefundAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ElapsedMinutes { get; set; }
    public string? ReportedBy { get; set; }
}

public class CreateComplaintDto
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
    public int? SupplierId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string>? ImageUrls { get; set; }
}

public class ResolveComplaintDto
{
    public string Action { get; set; } = string.Empty;  // "approve" | "reject" | "investigate"
    public string? AdminNote { get; set; }
    public decimal? RefundAmount { get; set; }
}

public class ComplaintFilterDto
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? Type { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
