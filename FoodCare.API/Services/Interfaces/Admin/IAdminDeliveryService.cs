using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Staff;

namespace FoodCare.API.Services.Interfaces.Admin;

/// <summary>
/// Admin delivery governance service — approve/reject/hold/override deliveries,
/// audit log, and KPI queries.
/// </summary>
public interface IAdminDeliveryService
{
    // =====================================================
    // Delivery Queries
    // =====================================================

    /// <summary>
    /// Get all deliveries with filters (admin view across all warehouses)
    /// </summary>
    Task<PagedResponse<AdminDeliverySummaryDto>> GetAllDeliveriesAsync(DeliveryFilterDto filter);

    /// <summary>
    /// Get deliveries pending admin approval
    /// </summary>
    Task<PagedResponse<AdminDeliverySummaryDto>> GetPendingDeliveriesAsync(int page, int pageSize);

    /// <summary>
    /// Get delivery detail with full governance info
    /// </summary>
    Task<AdminDeliveryDetailDto?> GetDeliveryDetailAsync(Guid shipmentId);

    // =====================================================
    // Admin Actions
    // =====================================================

    /// <summary>
    /// Delete a shipment (admin only)
    /// </summary>
    Task<bool> DeleteShipmentAsync(Guid shipmentId);

    /// <summary>
    /// Delete an inbound session (admin only)
    /// </summary>
    Task<bool> DeleteInboundSessionAsync(Guid sessionId);

    // =====================================================
    // Audit Log
    // =====================================================

    /// <summary>
    /// Get audit log entries with filters
    /// </summary>
    Task<PagedResponse<AdminActionLogDto>> GetAuditLogAsync(AuditLogFilterDto filter);

    // =====================================================
    // KPI
    // =====================================================

    /// <summary>
    /// Get delivery KPI for a specific warehouse
    /// </summary>
    Task<DeliveryKpiDto> GetDeliveryKpiAsync(Guid warehouseId, DateTime? from, DateTime? to);

    /// <summary>
    /// Get delivery KPIs for all warehouses
    /// </summary>
    Task<List<DeliveryKpiDto>> GetAllWarehouseKpisAsync(DateTime? from, DateTime? to);
}
