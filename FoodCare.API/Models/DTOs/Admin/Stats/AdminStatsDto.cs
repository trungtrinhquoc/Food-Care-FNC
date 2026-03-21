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
    public int OrdersToday { get; set; }
    public int PendingComplaints { get; set; }
    public decimal Gmv { get; set; }
    public decimal FAndCRevenue { get; set; }
    public int ActiveMarts { get; set; }
    public int ActiveUsersCount { get; set; }
    public int ActiveSubscriptions { get; set; }
    public decimal ChurnRate { get; set; }
    public decimal TodayRevenue { get; set; }
    public int CompletedOrders { get; set; }
    public int CancelledOrders { get; set; }
    public int ShippingOrders { get; set; }
    public int ConfirmedOrders { get; set; }
    public int NewCustomersThisWeek { get; set; }
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

public class OrderChartDataDto
{
    public string Period { get; set; } = string.Empty;
    public int Pending { get; set; }
    public int Confirmed { get; set; }
    public int Delivered { get; set; }
    public int Cancelled { get; set; }
    public int Total { get; set; }
}

public class CategoryRevenueDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class TopProductResponseDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int TotalSold { get; set; }
    public decimal Revenue { get; set; }
    public string? ImageUrl { get; set; }
}

public class UserTrafficDto
{
    public string Date { get; set; } = string.Empty;
    public int ActiveUsers { get; set; }
    public int NewUsers { get; set; }
    public int TotalLogins { get; set; }
}

public class LatestOrderDto
{
    public Guid OrderId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int ItemCount { get; set; }
}
