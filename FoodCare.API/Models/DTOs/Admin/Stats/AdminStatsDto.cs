namespace FoodCare.API.Models.DTOs.Admin.Stats;

public class AdminStatsDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalProducts { get; set; }
    public decimal MonthlyGrowth { get; set; }
    public int PendingOrders { get; set; }
    public int LowStockProducts { get; set; }
}

public class RevenueDataDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
}

public class DashboardSummaryDto
{
    public AdminStatsDto Stats { get; set; } = new();
    public List<RevenueDataDto> RevenueData { get; set; } = new();
    public List<OrderByStatusDto> OrdersByStatus { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
}

public class OrderByStatusDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TopProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int TotalSold { get; set; }
}
