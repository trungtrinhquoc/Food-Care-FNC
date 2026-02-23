namespace FoodCare.API.Models.DTOs.Admin.Subscriptions;

public class SendReminderRequest
{
    public List<Guid> SubscriptionIds { get; set; } = new();
    public string? CustomMessage { get; set; }
}

public class SendReminderResponse
{
    public bool Success { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}

public class SubscriptionFilters
{
    public string? Status { get; set; }
    public string? Frequency { get; set; }
    public string? SearchTerm { get; set; } // Search by customer name/email
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PaginatedSubscriptionsResponse
{
    public List<AdminSubscriptionDto> Subscriptions { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
