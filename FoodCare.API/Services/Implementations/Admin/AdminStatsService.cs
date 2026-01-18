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

        var revenueByMonth = await _context.Orders
            .Where(o => o.Status == OrderStatus.delivered && 
                   o.CreatedAt.HasValue && 
                   o.CreatedAt >= startDate)
            .GroupBy(o => new { 
                Year = o.CreatedAt!.Value.Year, 
                Month = o.CreatedAt.Value.Month 
            })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Revenue = g.Sum(o => o.TotalAmount)
            })
            .ToListAsync();

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
}
