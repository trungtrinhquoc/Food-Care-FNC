namespace FoodCare.API.Models.DTOs.Reviews
{
    public class RatingDistributionDto
    {
        public int Stars { get; set; }
        public int Count { get; set; }
        public double Percentage { get; set; }
    }
}
