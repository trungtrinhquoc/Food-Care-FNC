namespace FoodCare.API.Models.DTOs.Admin.Zalo;

public class ZaloMessageDto
{
    public Guid Id { get; set; }
    public string? UserEmail { get; set; }
    public string PhoneSent { get; set; } = string.Empty;
    public string? TemplateName { get; set; }
    public string? Status { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime SentAt { get; set; }
}

public class ZaloTemplateDto
{
    public int Id { get; set; }
    public string TemplateId { get; set; } = string.Empty;
    public string? TemplateName { get; set; }
    public string? ContentSample { get; set; }
    public decimal? Price { get; set; }
    public bool IsActive { get; set; }
}

public class ZaloMessageFilterDto
{
    public string? SearchTerm { get; set; }
    public string? Status { get; set; }
    public int? TemplateId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public bool SortDescending { get; set; } = true;
}

public class SendZaloMessageDto
{
    public Guid? UserId { get; set; }
    public Guid? OrderId { get; set; }
    public int TemplateId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
}

public class SendZaloMessageResultDto
{
    public bool Success { get; set; }
    public Guid? MessageId { get; set; }
    public DateTime? SentAt { get; set; }
    public string? ErrorMessage { get; set; }
}
