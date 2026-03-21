using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FoodCare.API.Services.Implementations.Admin;

/// <summary>
/// Implements commission recording, policy management, and reporting.
/// Per-order methods use the shared <see cref="FoodCareDbContext"/> and do NOT call
/// <c>SaveChangesAsync</c> themselves — callers commit in their own unit of work.
/// </summary>
public class CommissionService(FoodCareDbContext context, ILogger<CommissionService> logger)
    : ICommissionService
{
    private readonly FoodCareDbContext _context = context;
    private readonly ILogger<CommissionService> _logger = logger;

    // ── Effective policy look-up ──────────────────────────────────────────────

    private async Task<CommissionPolicy?> GetActivePolicyInternalAsync(int supplierId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1️⃣  Supplier-specific active policy (most recently effective first)
        var supplierPolicy = await _context.CommissionPolicies
            .Where(p => p.IsActive
                     && p.SupplierId == supplierId
                     && p.EffectiveFrom <= today
                     && (p.EffectiveTo == null || p.EffectiveTo >= today))
            .OrderByDescending(p => p.EffectiveFrom)
            .FirstOrDefaultAsync();

        if (supplierPolicy != null) return supplierPolicy;

        // 2️⃣  Global platform default
        return await _context.CommissionPolicies
            .Where(p => p.IsActive
                     && p.SupplierId == null
                     && p.EffectiveFrom <= today
                     && (p.EffectiveTo == null || p.EffectiveTo >= today))
            .OrderByDescending(p => p.EffectiveFrom)
            .FirstOrDefaultAsync();
    }

    // ── Core recording ────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task PrepareCommissionForOrderAsync(Guid orderId, int supplierId, decimal orderAmount)
    {
        // Idempotency: skip if already recorded
        if (await _context.OrderCommissions.AnyAsync(c => c.OrderId == orderId))
        {
            _logger.LogInformation("Commission already recorded for order {OrderId}; skipping.", orderId);
            return;
        }

        var policy = await GetActivePolicyInternalAsync(supplierId);
        // Hard floor / ceiling: 8–15% as per business requirement; platform default is 15%
        var rate = policy?.CommissionRate ?? 15m;

        var commissionAmount = Math.Round(orderAmount * rate / 100m, 2);
        var supplierAmount   = orderAmount - commissionAmount;

        _context.OrderCommissions.Add(new OrderCommission
        {
            Id               = Guid.NewGuid(),
            OrderId          = orderId,
            SupplierId       = supplierId,
            PolicyId         = policy?.Id,
            OrderAmount      = orderAmount,
            CommissionRate   = rate,
            CommissionAmount = commissionAmount,
            SupplierAmount   = supplierAmount,
            Status           = "pending",
            CreatedAt        = DateTime.UtcNow,
        });

        // Update running supplier financial counters
        var supplier = await _context.Suppliers.FindAsync(supplierId);
        if (supplier != null)
        {
            supplier.TotalRevenue  = (supplier.TotalRevenue  ?? 0m) + orderAmount;
            supplier.PendingPayout = (supplier.PendingPayout ?? 0m) + supplierAmount;
            supplier.UpdatedAt     = DateTime.UtcNow;
        }

        _logger.LogInformation(
            "Staged commission for order {OrderId}: rate={Rate}%, commission={Commission}, due={Due}",
            orderId, rate, commissionAmount, supplierAmount);
    }

    /// <inheritdoc/>
    public async Task PrepareCommissionRefundAsync(Guid orderId)
    {
        var commission = await _context.OrderCommissions
            .FirstOrDefaultAsync(c => c.OrderId == orderId && c.Status == "pending");

        if (commission == null)
        {
            _logger.LogInformation(
                "No pending commission found for order {OrderId}; refund skipped.", orderId);
            return;
        }

        commission.Status = "refunded";

        // Reverse supplier payout counter
        var supplier = await _context.Suppliers.FindAsync(commission.SupplierId);
        if (supplier != null)
        {
            supplier.TotalRevenue  = Math.Max(0m, (supplier.TotalRevenue  ?? 0m) - commission.OrderAmount);
            supplier.PendingPayout = Math.Max(0m, (supplier.PendingPayout ?? 0m) - commission.SupplierAmount);
            supplier.UpdatedAt = DateTime.UtcNow;
        }

        _logger.LogInformation(
            "Staged commission refund for order {OrderId}, commission record {CommissionId}.",
            orderId, commission.Id);
    }

    // ── Policy management ─────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<List<CommissionPolicyDto>> GetPoliciesAsync()
    {
        var policies = await _context.CommissionPolicies
            .Include(p => p.Supplier)
            .OrderByDescending(p => p.IsActive)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync();

        return policies.Select(ToDto).ToList();
    }

    /// <inheritdoc/>
    public async Task<CommissionPolicyDto?> GetEffectivePolicyAsync(int supplierId)
    {
        var policy = await GetActivePolicyInternalAsync(supplierId);
        return policy is null ? null : ToDto(policy);
    }

    /// <inheritdoc/>
    public async Task<CommissionPolicyDto> UpsertGlobalDefaultAsync(
        SetCommissionRateRequest request, Guid adminId)
    {
        ValidateRate(request.Rate);

        // Deactivate any existing active global defaults
        var existing = await _context.CommissionPolicies
            .Where(p => p.SupplierId == null && p.IsActive)
            .ToListAsync();
        existing.ForEach(p => p.IsActive = false);

        var policy = new CommissionPolicy
        {
            SupplierId     = null,
            CommissionRate = request.Rate,
            EffectiveFrom  = request.EffectiveFrom ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Description    = request.Description,
            CreatedBy      = adminId,
            CreatedAt      = DateTime.UtcNow,
            IsActive       = true,
        };

        _context.CommissionPolicies.Add(policy);
        await _context.SaveChangesAsync();
        await _context.Entry(policy).Reference(p => p.Supplier).LoadAsync();

        _logger.LogInformation(
            "Admin {AdminId} set global commission rate to {Rate}%.", adminId, request.Rate);

        return ToDto(policy);
    }

    /// <inheritdoc/>
    public async Task<CommissionPolicyDto> UpsertSupplierPolicyAsync(
        int supplierId, SetCommissionRateRequest request, Guid adminId)
    {
        ValidateRate(request.Rate);

        var supplier = await _context.Suppliers.FindAsync(supplierId)
                       ?? throw new KeyNotFoundException($"Supplier {supplierId} not found.");

        // Deactivate existing supplier policies
        var existing = await _context.CommissionPolicies
            .Where(p => p.SupplierId == supplierId && p.IsActive)
            .ToListAsync();
        existing.ForEach(p => p.IsActive = false);

        var policy = new CommissionPolicy
        {
            SupplierId     = supplierId,
            CommissionRate = request.Rate,
            EffectiveFrom  = request.EffectiveFrom ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Description    = request.Description,
            CreatedBy      = adminId,
            CreatedAt      = DateTime.UtcNow,
            IsActive       = true,
        };

        // Mirror rate onto Supplier for quick access in existing finance queries
        supplier.CommissionRate = request.Rate;
        supplier.UpdatedAt      = DateTime.UtcNow;

        _context.CommissionPolicies.Add(policy);
        await _context.SaveChangesAsync();
        await _context.Entry(policy).Reference(p => p.Supplier).LoadAsync();

        _logger.LogInformation(
            "Admin {AdminId} set supplier {SupplierId} commission rate to {Rate}%.",
            adminId, supplierId, request.Rate);

        return ToDto(policy);
    }

    /// <inheritdoc/>
    public async Task<bool> DeactivatePolicyAsync(int policyId)
    {
        var policy = await _context.CommissionPolicies.FindAsync(policyId);
        if (policy is null) return false;

        policy.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    // ── Reporting ─────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<PagedResult<OrderCommissionDto>> GetOrderCommissionsAsync(
        int? supplierId, int? month, int? year, string? status, int page, int pageSize)
    {
        var query = _context.OrderCommissions
            .Include(c => c.Supplier)
            .AsQueryable();

        if (supplierId.HasValue)
            query = query.Where(c => c.SupplierId == supplierId.Value);

        if (month.HasValue)
            query = query.Where(c => c.CreatedAt.Month == month.Value);

        if (year.HasValue)
            query = query.Where(c => c.CreatedAt.Year == year.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(c => c.Status == status);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new OrderCommissionDto
            {
                Id               = c.Id,
                OrderId          = c.OrderId,
                SupplierId       = c.SupplierId,
                SupplierName     = c.Supplier.StoreName,
                OrderAmount      = c.OrderAmount,
                CommissionRate   = c.CommissionRate,
                CommissionAmount = c.CommissionAmount,
                SupplierAmount   = c.SupplierAmount,
                Status           = c.Status,
                SettlementId     = c.SettlementId,
                CreatedAt        = c.CreatedAt,
            })
            .ToListAsync();

        return new PagedResult<OrderCommissionDto>
        {
            Items      = items,
            TotalItems = total,
            Page       = page,
            PageSize   = pageSize,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize),
        };
    }

    /// <inheritdoc/>
    public async Task<CommissionReportDto> GetCommissionReportAsync(int? month, int? year)
    {
        var now = DateTime.UtcNow;
        var m = month ?? now.Month;
        var y = year  ?? now.Year;

        var commissions = await _context.OrderCommissions
            .Include(c => c.Supplier)
            .Where(c => c.CreatedAt.Month == m && c.CreatedAt.Year == y)
            .ToListAsync();

        var bySupplier = commissions
            .GroupBy(c => c.SupplierId)
            .Select(g =>
            {
                var first = g.First();
                return new CommissionBySupplierDto
                {
                    SupplierId    = g.Key,
                    SupplierName  = first.Supplier?.StoreName ?? "Unknown",
                    EffectiveRate = g.Any() ? g.Average(c => (double)c.CommissionRate) switch
                        { var r => (decimal)r } : 0m,
                    TotalSales      = g.Sum(c => c.OrderAmount),
                    TotalCommission = g.Sum(c => c.CommissionAmount),
                    TotalDue        = g.Sum(c => c.SupplierAmount),
                    OrderCount      = g.Count(),
                    PendingCount    = g.Count(c => c.Status == "pending"),
                    SettledCount    = g.Count(c => c.Status == "settled"),
                };
            })
            .OrderByDescending(x => x.TotalCommission)
            .ToList();

        return new CommissionReportDto
        {
            Month                = m,
            Year                 = y,
            TotalOrderAmount     = commissions.Sum(c => c.OrderAmount),
            TotalCommissionAmount = commissions.Sum(c => c.CommissionAmount),
            TotalSupplierAmount  = commissions.Sum(c => c.SupplierAmount),
            TotalOrderCount      = commissions.Count,
            PendingCount         = commissions.Count(c => c.Status == "pending"),
            SettledCount         = commissions.Count(c => c.Status == "settled"),
            RefundedCount        = commissions.Count(c => c.Status == "refunded"),
            BySupplier           = bySupplier,
        };
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static void ValidateRate(decimal rate)
    {
        if (rate < 0m || rate > 100m)
            throw new ArgumentOutOfRangeException(nameof(rate), "Commission rate must be between 0 and 100.");
    }

    private static CommissionPolicyDto ToDto(CommissionPolicy p) => new()
    {
        Id             = p.Id,
        SupplierId     = p.SupplierId,
        SupplierName   = p.Supplier?.StoreName,
        CategoryId     = p.CategoryId,
        CommissionRate = p.CommissionRate,
        EffectiveFrom  = p.EffectiveFrom,
        EffectiveTo    = p.EffectiveTo,
        Description    = p.Description,
        IsActive       = p.IsActive,
        CreatedAt      = p.CreatedAt,
    };
}
