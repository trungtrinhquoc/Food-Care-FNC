using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.Suppliers;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminFinanceService : IAdminFinanceService
{
    private readonly FoodCareDbContext _context;

    public AdminFinanceService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<FinanceSummaryDto> GetSummaryAsync(int month, int year)
    {
        // GMV from Orders (the main order table)
        var orders = await _context.Orders
            .Where(o => o.CreatedAt.HasValue &&
                        o.CreatedAt.Value.Month == month &&
                        o.CreatedAt.Value.Year == year &&
                        (o.Status == OrderStatus.confirmed || o.Status == OrderStatus.delivered))
            .ToListAsync();

        var gmv = orders.Sum(o => o.TotalAmount);

        // Average commission rate from active suppliers
        var avgCommission = await _context.Suppliers
            .Where(s => s.IsActive == true && s.CommissionRate.HasValue)
            .AverageAsync(s => (double?)s.CommissionRate) ?? 15.0;

        var fAndCRevenue = gmv * (decimal)(avgCommission / 100);

        // Total wallet balance across all users (AccountBalance is non-nullable decimal)
        var totalWallet = await _context.Users
            .SumAsync(u => u.AccountBalance);

        // Total refunded from resolved complaints in this period
        var totalRefunded = await _context.Complaints
            .Where(c => c.Status == "resolved" &&
                        c.RefundAmount.HasValue &&
                        c.UpdatedAt.Month == month &&
                        c.UpdatedAt.Year == year)
            .SumAsync(c => c.RefundAmount ?? 0);

        return new FinanceSummaryDto
        {
            Gmv = gmv,
            FAndCRevenue = fAndCRevenue,
            TotalWalletBalance = totalWallet,
            TotalRefunded = totalRefunded,
            WalletReserveMin = totalWallet * 0.1m,
            Month = month,
            Year = year
        };
    }

    public async Task<List<MartSettlementDto>> GetSettlementsAsync(int month, int year)
    {
        // Use SupplierOrders table which has the SupplierId relationship
        var suppliers = await _context.Suppliers
            .Where(s => s.IsActive == true)
            .ToListAsync();

        var supplierOrders = await _context.SupplierOrders
            .Where(o => o.CreatedAt.HasValue &&
                        o.CreatedAt.Value.Month == month &&
                        o.CreatedAt.Value.Year == year &&
                        (o.Status == "confirmed" || o.Status == "delivered"))
            .ToListAsync();

        var settlements = new List<MartSettlementDto>();

        foreach (var supplier in suppliers)
        {
            var orders = supplierOrders.Where(o => o.SupplierId == supplier.Id).ToList();
            if (!orders.Any()) continue;

            var totalSales = orders.Sum(o => o.TotalAmount);
            var commissionRate = supplier.CommissionRate ?? 15m;
            var commissionAmount = totalSales * (commissionRate / 100);
            var amountDue = totalSales - commissionAmount;

            settlements.Add(new MartSettlementDto
            {
                SupplierId = supplier.Id,
                StoreName = supplier.StoreName,
                TotalSales = totalSales,
                CommissionRate = commissionRate,
                CommissionAmount = commissionAmount,
                AmountDue = amountDue,
                IsPaid = false
            });
        }

        return settlements.OrderByDescending(s => s.AmountDue).ToList();
    }

    public async Task SettleAllAsync(int month, int year)
    {
        var settlements = await GetSettlementsAsync(month, year);

        foreach (var settlement in settlements.Where(s => !s.IsPaid))
        {
            var supplier = await _context.Suppliers.FindAsync(settlement.SupplierId);
            if (supplier != null)
            {
                supplier.TotalCommission = (supplier.TotalCommission ?? 0) + settlement.CommissionAmount;
                supplier.PendingPayout = Math.Max(0, (supplier.PendingPayout ?? 0) - settlement.AmountDue);
            }
        }

        await _context.SaveChangesAsync();
    }
}
