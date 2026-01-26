using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin.Stats;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminStatsService : IAdminStatsService
{
    private readonly FoodCareDbContext _context;

    public AdminStatsService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<AdminStatsDto> GetDashboardStatsAsync()
    {
        var totalRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.delivered)
            .SumAsync(o => o.TotalAmount);

        var totalOrders = await _context.Orders.CountAsync();
        var totalCustomers = await _context.Users
            .Where(u => u.Role == UserRole.customer)
            .CountAsync();
        var totalProducts = await _context.Products.CountAsync();

        var now = DateTime.UtcNow;
        var currentMonthRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.delivered && 
                   o.CreatedAt.HasValue &&
                   o.CreatedAt.Value.Month == now.Month && 
                   o.CreatedAt.Value.Year == now.Year)
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

        var lastMonthRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.delivered && 
                   o.CreatedAt.HasValue &&
                   o.CreatedAt.Value.Month == now.AddMonths(-1).Month && 
                   o.CreatedAt.Value.Year == now.AddMonths(-1).Year)
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

        var monthlyGrowth = lastMonthRevenue > 0
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        var pendingOrders = await _context.Orders
            .CountAsync(o => o.Status == OrderStatus.pending);
        
        var lowStockProducts = await _context.Products
            .CountAsync(p => p.StockQuantity.HasValue && 
                        p.LowStockThreshold.HasValue &&
                        p.StockQuantity <= p.LowStockThreshold && 
                        p.IsActive == true);

        return new AdminStatsDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            TotalCustomers = totalCustomers,
            TotalProducts = totalProducts,
            MonthlyGrowth = monthlyGrowth,
            PendingOrders = pendingOrders,
            LowStockProducts = lowStockProducts
        };
    }

    public async Task<List<RevenueDataDto>> GetRevenueDataAsync(int months = 6)
    {
        var result = new List<RevenueDataDto>();
        var startDate = DateTime.UtcNow.AddMonths(-months);

        // Fetch raw data first to avoid LINQ translation issues with date grouping
        var rawData = await _context.Orders
            .Where(o => o.Status == OrderStatus.delivered && 
                   o.CreatedAt.HasValue && 
                   o.CreatedAt >= startDate)
            .Select(o => new { o.CreatedAt, o.TotalAmount })
            .ToListAsync();

        var revenueByMonth = rawData
            .GroupBy(o => new { 
                Year = o.CreatedAt!.Value.Year, 
                Month = o.CreatedAt!.Value.Month 
            })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Revenue = g.Sum(o => o.TotalAmount)
            })
            .ToList();

        for (int i = 0; i < months; i++)
        {
            var date = DateTime.UtcNow.AddMonths(-i);
            var data = revenueByMonth.FirstOrDefault(r => r.Year == date.Year && r.Month == date.Month);

            result.Add(new RevenueDataDto
            {
                Month = date.ToString("MMM yyyy"),
                Revenue = data?.Revenue ?? 0
            });
        }

        result.Reverse();
        return result;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var ordersByStatus = await _context.Orders
            .GroupBy(o => o.Status)
            .Select(g => new OrderByStatusDto
            {
                Status = g.Key.ToString(),
                Count = g.Count()
            })
            .ToListAsync();

        var topProducts = await _context.OrderItems
            .Include(oi => oi.Product)
            .Where(oi => oi.ProductId.HasValue)
            .GroupBy(oi => new { ProductId = oi.ProductId!.Value, ProductName = oi.Product!.Name })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                TotalSold = g.Sum(oi => oi.Quantity)
            })
            .OrderByDescending(p => p.TotalSold)
            .Take(5)
            .ToListAsync();

        return new DashboardSummaryDto
        {
            OrdersByStatus = ordersByStatus,
            TopProducts = topProducts
        };
    }

    public async Task<List<OrderChartDataDto>> GetOrdersChartDataAsync(int days = 7)
    {
        var result = new List<OrderChartDataDto>();
        var startDate = DateTime.UtcNow.AddDays(-days).Date;
        var endDate = DateTime.UtcNow.Date.AddDays(1); // Include today

        // Fetch all relevant orders in one query
        var orders = await _context.Orders
            .Where(o => o.CreatedAt.HasValue && 
                   o.CreatedAt.Value >= startDate && 
                   o.CreatedAt.Value < endDate)
            .Select(o => new { o.CreatedAt, o.Status })
            .ToListAsync();

        if (days == 7)
        {
            var dayNames = new[] { "CN", "T2", "T3", "T4", "T5", "T6", "T7" };
            for (int i = 6; i >= 0; i--)
            {
                var date = DateTime.UtcNow.AddDays(-i).Date;
                var dayName = dayNames[(int)date.DayOfWeek];

                var ordersForDay = orders.Where(o => o.CreatedAt!.Value.Date == date).ToList();

                var pending = ordersForDay.Count(o => o.Status == OrderStatus.pending);
                var confirmed = ordersForDay.Count(o => o.Status == OrderStatus.confirmed);
                var delivered = ordersForDay.Count(o => o.Status == OrderStatus.delivered);
                var cancelled = ordersForDay.Count(o => o.Status == OrderStatus.cancelled);

                result.Add(new OrderChartDataDto
                {
                    Period = dayName,
                    Pending = pending,
                    Confirmed = confirmed,
                    Delivered = delivered,
                    Cancelled = cancelled,
                    Total = pending + confirmed + delivered + cancelled
                });
            }
        }
        else if (days == 30)
        {
            for (int week = 3; week >= 0; week--)
            {
                var weekStart = DateTime.UtcNow.AddDays(-(week * 7 + 7)).Date;
                var weekEnd = DateTime.UtcNow.AddDays(-(week * 7)).Date;

                var ordersForWeek = orders.Where(o => o.CreatedAt!.Value.Date >= weekStart && o.CreatedAt!.Value.Date < weekEnd).ToList();

                var pending = ordersForWeek.Count(o => o.Status == OrderStatus.pending);
                var confirmed = ordersForWeek.Count(o => o.Status == OrderStatus.confirmed);
                var delivered = ordersForWeek.Count(o => o.Status == OrderStatus.delivered);
                var cancelled = ordersForWeek.Count(o => o.Status == OrderStatus.cancelled);

                result.Add(new OrderChartDataDto
                {
                    Period = $"Tuần {4 - week}",
                    Pending = pending,
                    Confirmed = confirmed,
                    Delivered = delivered,
                    Cancelled = cancelled,
                    Total = pending + confirmed + delivered + cancelled
                });
            }
        }
        else if (days >= 365)
        {
             // For yearly, we might need a larger range, so let's re-fetch if strict 365 days logic is used 
             // essentially reproducing logic but in memory. 
             // Since startDate was set to -days, 'orders' list already contains the data.
             
            for (int month = 11; month >= 0; month--)
            {
                var date = DateTime.UtcNow.AddMonths(-month);
                var monthName = $"T{date.Month}";

                var ordersForMonth = orders.Where(o => o.CreatedAt!.Value.Year == date.Year && o.CreatedAt!.Value.Month == date.Month).ToList();

                var pending = ordersForMonth.Count(o => o.Status == OrderStatus.pending);
                var confirmed = ordersForMonth.Count(o => o.Status == OrderStatus.confirmed);
                var delivered = ordersForMonth.Count(o => o.Status == OrderStatus.delivered);
                var cancelled = ordersForMonth.Count(o => o.Status == OrderStatus.cancelled);

                result.Add(new OrderChartDataDto
                {
                    Period = monthName,
                    Pending = pending,
                    Confirmed = confirmed,
                    Delivered = delivered,
                    Cancelled = cancelled,
                    Total = pending + confirmed + delivered + cancelled
                });
            }
        }

        return result;
    }
}
