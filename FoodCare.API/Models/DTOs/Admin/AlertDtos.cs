namespace FoodCare.API.Models.DTOs.Admin;

public class AdminAlertDto
{
    public Guid Id { get; set; }
    public int SupplierId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "medium";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? Data { get; set; }
}

public class AdminAlertFilterDto
{
    public string? Type { get; set; }
    public string? Severity { get; set; }
    public bool? IsRead { get; set; }
    public int? SupplierId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
