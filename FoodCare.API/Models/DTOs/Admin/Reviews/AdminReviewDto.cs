namespace FoodCare.API.Models.DTOs.Admin.Reviews;

public class AdminReviewDto
{
    public Guid Id { get; set; }
    public Guid? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductImage { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public Guid? OrderId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public string? Images { get; set; }
    public bool IsVerifiedPurchase { get; set; }
    public string? ReplyComment { get; set; }
    public DateTime? ReplyAt { get; set; }
    public bool IsHidden { get; set; }
    public int HelpfulCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminReviewFilterDto
{
    public Guid? ProductId { get; set; }
    public Guid? UserId { get; set; }
    public int? MinRating { get; set; }
    public int? MaxRating { get; set; }
    public bool? IsVerifiedPurchase { get; set; }
    public bool? IsHidden { get; set; }
    public bool? HasReply { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = true;
}

public class ReplyReviewDto
{
    public string ReplyComment { get; set; } = string.Empty;
}

public class ReviewStatsDto
{
    public int TotalReviews { get; set; }
    public double AverageRating { get; set; }
    public int FiveStarCount { get; set; }
    public int FourStarCount { get; set; }
    public int ThreeStarCount { get; set; }
    public int TwoStarCount { get; set; }
    public int OneStarCount { get; set; }
    public int PendingReplyCount { get; set; }
}
