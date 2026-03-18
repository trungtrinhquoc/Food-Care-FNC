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

        // OrdersToday
        var today = now.Date;
        var tomorrow = today.AddDays(1);
        var ordersToday = await _context.Orders
            .CountAsync(o => o.CreatedAt.HasValue && o.CreatedAt.Value >= today && o.CreatedAt.Value < tomorrow);

        // PendingComplaints
        int pendingComplaints = 0;
        try
        {
            pendingComplaints = await _context.Complaints.CountAsync(c => c.Status == "pending");
        }
        catch { pendingComplaints = 0; }

        // GMV = SUM total_amount for confirmed/delivered orders this month
        var gmv = await _context.Orders
            .Where(o => o.CreatedAt.HasValue &&
                        o.CreatedAt.Value.Month == now.Month &&
                        o.CreatedAt.Value.Year == now.Year &&
                        (o.Status == OrderStatus.confirmed || o.Status == OrderStatus.delivered))
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

        // F&C Revenue = GMV * average commission rate
        var avgCommissionRate = await _context.Suppliers
            .Where(s => s.IsActive == true)
            .AverageAsync(s => (double?)s.CommissionRate) ?? 15.0;
        var fAndCRevenue = gmv * (decimal)(avgCommissionRate / 100);

        // ActiveMarts = suppliers with IsActive = true
        var activeMarts = await _context.Suppliers.CountAsync(s => s.IsActive == true);

        // ActiveUsers = users who logged in within last 30 days
        var thirtyDaysAgo = now.AddDays(-30);
        var activeUsersCount = await _context.LoginLogs
            .Where(l => l.LoginAt.HasValue && l.LoginAt.Value >= thirtyDaysAgo && l.Success == true)
            .Select(l => l.UserId)
            .Distinct()
            .CountAsync();

        // ActiveSubscriptions
        var activeSubscriptions = await _context.Subscriptions
            .CountAsync(s => s.Status == SubStatus.active);

        // ChurnRate = % subscriptions cancelled this month vs total created this month
        var totalSubsThisMonth = await _context.Subscriptions
            .CountAsync(s => s.CreatedAt.HasValue &&
                             s.CreatedAt.Value.Month == now.Month &&
                             s.CreatedAt.Value.Year == now.Year);
        var cancelledSubsThisMonth = await _context.Subscriptions
            .CountAsync(s => s.CreatedAt.HasValue &&
                             s.CreatedAt.Value.Month == now.Month &&
                             s.CreatedAt.Value.Year == now.Year &&
                             s.Status == SubStatus.cancelled);
        var churnRate = totalSubsThisMonth > 0
            ? (decimal)cancelledSubsThisMonth / totalSubsThisMonth * 100
            : 0;

        return new AdminStatsDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            TotalCustomers = totalCustomers,
            TotalProducts = totalProducts,
            MonthlyGrowth = monthlyGrowth,
            PendingOrders = pendingOrders,
            LowStockProducts = lowStockProducts,
            OrdersToday = ordersToday,
            PendingComplaints = pendingComplaints,
            Gmv = gmv,
            FAndCRevenue = fAndCRevenue,
            ActiveMarts = activeMarts,
            ActiveUsersCount = activeUsersCount,
            ActiveSubscriptions = activeSubscriptions,
            ChurnRate = churnRate
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

    public async Task<List<CategoryRevenueDto>> GetCategoryRevenueAsync()
    {
        var colors = new[] { "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16" };

        var rawData = await _context.OrderItems
            .Include(oi => oi.Product)
                .ThenInclude(p => p!.Category)
            .Include(oi => oi.Order)
            .Where(oi => oi.Order != null && oi.Order.Status == OrderStatus.delivered &&
                         oi.Product != null && oi.Product.Category != null)
            .Select(oi => new
            {
                CategoryName = oi.Product!.Category!.Name,
                Revenue = oi.TotalPrice ?? (oi.Price * oi.Quantity),
                OrderId = oi.OrderId
            })
            .ToListAsync();

        var result = rawData
            .GroupBy(x => x.CategoryName)
            .Select((g, index) => new CategoryRevenueDto
            {
                CategoryName = g.Key,
                Revenue = g.Sum(x => x.Revenue),
                OrderCount = g.Select(x => x.OrderId).Distinct().Count(),
                Color = colors[index % colors.Length]
            })
            .OrderByDescending(c => c.Revenue)
            .ToList();

        return result;
    }

    public async Task<List<TopProductResponseDto>> GetTopProductsAsync(int limit = 5)
    {
        var result = await _context.OrderItems
            .Include(oi => oi.Product)
            .Where(oi => oi.ProductId.HasValue && oi.Product != null)
            .GroupBy(oi => new { ProductId = oi.ProductId!.Value, oi.Product!.Name, oi.Product.Images })
            .Select(g => new TopProductResponseDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                TotalSold = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.TotalPrice ?? (oi.Price * oi.Quantity)),
                ImageUrl = g.Key.Images
            })
            .OrderByDescending(p => p.TotalSold)
            .Take(limit)
            .ToListAsync();

        return result;
    }

    public async Task<List<UserTrafficDto>> GetUserTrafficAsync(int days = 7)
    {
        var result = new List<UserTrafficDto>();
        var startDate = DateTime.UtcNow.AddDays(-days).Date;

        // Get login data from LoginLogs
        var loginData = await _context.LoginLogs
            .Where(l => l.LoginAt.HasValue && l.LoginAt.Value >= startDate && l.Success == true)
            .Select(l => new { l.LoginAt, l.UserId })
            .ToListAsync();

        // Get new user registrations
        var newUsers = await _context.Users
            .Where(u => u.CreatedAt.HasValue && u.CreatedAt.Value >= startDate)
            .Select(u => new { u.CreatedAt })
            .ToListAsync();

        for (int i = days - 1; i >= 0; i--)
        {
            var date = DateTime.UtcNow.AddDays(-i).Date;

            var loginsForDay = loginData.Where(l => l.LoginAt!.Value.Date == date).ToList();
            var newUsersForDay = newUsers.Count(u => u.CreatedAt!.Value.Date == date);

            result.Add(new UserTrafficDto
            {
                Date = date.ToString("dd/MM"),
                ActiveUsers = loginsForDay.Select(l => l.UserId).Distinct().Count(),
                NewUsers = newUsersForDay,
                TotalLogins = loginsForDay.Count
            });
        }

        return result;
    }
}
