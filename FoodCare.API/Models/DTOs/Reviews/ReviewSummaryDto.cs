namespace FoodCare.API.Models.DTOs.Reviews
{
    public class ReviewSummaryDto
    {
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public List<RatingDistributionDto> RatingDistribution { get; set; } = [];
        public List<ReviewItemDto> Reviews { get; set; } = [];
    }


}
