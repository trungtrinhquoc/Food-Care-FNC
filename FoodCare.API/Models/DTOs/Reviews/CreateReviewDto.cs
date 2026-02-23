namespace FoodCare.API.Models.DTOs.Reviews
{
    public class CreateReviewDto
    {
        public Guid ProductId { get; set; }
        public int Rating { get; set; } // 1–5
        public string? Comment { get; set; }
        public List<string>? Images { get; set; }
    }
}
