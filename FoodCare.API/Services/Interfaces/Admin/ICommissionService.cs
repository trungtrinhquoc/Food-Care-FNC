using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;

namespace FoodCare.API.Services.Interfaces.Admin;

/// <summary>
/// Manages commission calculation, policy configuration, and per-order commission recording.
/// </summary>
public interface ICommissionService
{
    // ── Core recording ────────────────────────────────────────────────────────

    /// <summary>
    /// Stages an <see cref="OrderCommission"/> entity on the shared DbContext for the
    /// given delivered order, and updates supplier financial counters.
    /// <para>
    /// Does <b>not</b> call SaveChangesAsync — the caller is responsible for saving.
    /// This design ensures the commission is committed atomically with any other
    /// state changes made in the same unit of work.
    /// </para>
    /// </summary>
    /// <param name="orderId">The delivered order.</param>
    /// <param name="supplierId">The mart/supplier that fulfilled the order.</param>
    /// <param name="orderAmount">Gross order value (TotalAmount).</param>
    Task PrepareCommissionForOrderAsync(Guid orderId, int supplierId, decimal orderAmount);

    /// <summary>
    /// Reverses a pending commission when an order is returned/refunded.
    /// Marks the <see cref="OrderCommission"/> as "refunded" and decrements
    /// <c>Supplier.PendingPayout</c>.
    /// Does <b>not</b> call SaveChangesAsync.
    /// </summary>
    Task PrepareCommissionRefundAsync(Guid orderId);

    // ── Policy management ─────────────────────────────────────────────────────

    /// <summary>Returns all commission policies (global + per-supplier).</summary>
    Task<List<CommissionPolicyDto>> GetPoliciesAsync();

    /// <summary>
    /// Returns the effective policy for a supplier:
    /// supplier-specific active policy first, then global default.
    /// </summary>
    Task<CommissionPolicyDto?> GetEffectivePolicyAsync(int supplierId);

    /// <summary>Creates or replaces the global platform-wide default commission rate.</summary>
    Task<CommissionPolicyDto> UpsertGlobalDefaultAsync(SetCommissionRateRequest request, Guid adminId);

    /// <summary>Creates or replaces a supplier-specific commission rate override.</summary>
    Task<CommissionPolicyDto> UpsertSupplierPolicyAsync(int supplierId, SetCommissionRateRequest request, Guid adminId);

    /// <summary>Soft-deactivates a specific policy by its ID.</summary>
    Task<bool> DeactivatePolicyAsync(int policyId);

    // ── Reporting ─────────────────────────────────────────────────────────────

    /// <summary>Returns a paged list of per-order commission records.</summary>
    Task<PagedResult<OrderCommissionDto>> GetOrderCommissionsAsync(
        int? supplierId, int? month, int? year, string? status, int page, int pageSize);

    /// <summary>Returns an aggregated commission report for a given period.</summary>
    Task<CommissionReportDto> GetCommissionReportAsync(int? month, int? year);
}
