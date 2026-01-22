namespace FoodCare.API.Models.DTOs.Reviews
{
    public class ReviewItemDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = null!;
        public string? UserAvatar { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public int HelpfulCount { get; set; }
        public bool IsVerifiedPurchase { get; set; }
        public List<string> Images { get; set; } = new();
    }
}
