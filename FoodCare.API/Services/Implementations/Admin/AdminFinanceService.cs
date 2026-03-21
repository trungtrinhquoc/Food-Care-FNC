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
        // Check for persisted settlement records first
        var persistedSettlements = await _context.Settlements
            .Include(s => s.Supplier)
            .Where(s => s.Month == month && s.Year == year)
            .ToListAsync();

        if (persistedSettlements.Count > 0)
        {
            return persistedSettlements
                .Select(s => new MartSettlementDto
                {
                    SupplierId = s.SupplierId,
                    StoreName = s.Supplier.StoreName,
                    TotalSales = s.TotalSales,
                    CommissionRate = s.CommissionRate,
                    CommissionAmount = s.CommissionAmount,
                    AmountDue = s.AmountDue,
                    IsPaid = s.IsPaid
                })
                .OrderByDescending(s => s.AmountDue)
                .ToList();
        }

        // Calculate from orders if no persisted settlements exist
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
        // Prevent double settlement
        var alreadySettled = await _context.Settlements
            .AnyAsync(s => s.Month == month && s.Year == year && s.IsPaid);
        if (alreadySettled) return;

        var now = DateTime.UtcNow;

        // ── New path: aggregate from per-order OrderCommission ledger ─────────
        var pendingCommissions = await _context.OrderCommissions
            .Include(c => c.Supplier)
            .Where(c => c.Status == "pending"
                     && c.CreatedAt.Month == month
                     && c.CreatedAt.Year  == year)
            .ToListAsync();

        if (pendingCommissions.Count > 0)
        {
            var grouped = pendingCommissions.GroupBy(c => c.SupplierId);

            foreach (var group in grouped)
            {
                var totalSales       = group.Sum(c => c.OrderAmount);
                var commissionAmount = group.Sum(c => c.CommissionAmount);
                var supplierAmount   = group.Sum(c => c.SupplierAmount);
                // Weighted-average rate for display purposes
                var commissionRate   = totalSales > 0
                    ? Math.Round(commissionAmount / totalSales * 100m, 2)
                    : 15m;

                var settlementId = Guid.NewGuid();

                _context.Settlements.Add(new Settlement
                {
                    Id               = settlementId,
                    SupplierId       = group.Key,
                    Month            = month,
                    Year             = year,
                    TotalSales       = totalSales,
                    CommissionRate   = commissionRate,
                    CommissionAmount = commissionAmount,
                    AmountDue        = supplierAmount,
                    IsPaid           = true,
                    PaidAt           = now,
                    CreatedAt        = now,
                });

                // Link commission records to this settlement
                foreach (var c in group)
                {
                    c.SettlementId = settlementId;
                    c.Status       = "settled";
                }

                // Update supplier running totals
                var supplier = group.First().Supplier;
                if (supplier != null)
                {
                    supplier.TotalCommission = (supplier.TotalCommission ?? 0m) + commissionAmount;
                    supplier.PendingPayout   = Math.Max(0m, (supplier.PendingPayout ?? 0m) - supplierAmount);
                    supplier.UpdatedAt       = now;
                }
            }
        }
        else
        {
            // ── Legacy fallback: build from SupplierOrders (pre-commission-ledger era) ─
            var dtos = await GetSettlementsAsync(month, year);

            foreach (var dto in dtos.Where(s => !s.IsPaid))
            {
                var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
                if (supplier != null)
                {
                    supplier.TotalCommission = (supplier.TotalCommission ?? 0m) + dto.CommissionAmount;
                    supplier.PendingPayout   = Math.Max(0m, (supplier.PendingPayout ?? 0m) - dto.AmountDue);
                }

                _context.Settlements.Add(new Settlement
                {
                    Id               = Guid.NewGuid(),
                    SupplierId       = dto.SupplierId,
                    Month            = month,
                    Year             = year,
                    TotalSales       = dto.TotalSales,
                    CommissionRate   = dto.CommissionRate,
                    CommissionAmount = dto.CommissionAmount,
                    AmountDue        = dto.AmountDue,
                    IsPaid           = true,
                    PaidAt           = now,
                    CreatedAt        = now,
                });
            }
        }

        await _context.SaveChangesAsync();
    }
}
