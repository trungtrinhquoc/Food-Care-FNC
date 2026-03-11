using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FoodCare.API.Models.DTOs.Admin;

// =====================================================
// ADMIN DELIVERY GOVERNANCE DTOs
// =====================================================

/// <summary>
/// Request to approve a delivery
/// </summary>
public class AdminApproveDeliveryDto
{
    public string? Notes { get; set; }
}

/// <summary>
/// Request to reject a delivery
/// </summary>
public class AdminRejectDeliveryDto
{
    [Required(ErrorMessage = "Reason is required when rejecting a delivery")]
    public string Reason { get; set; } = null!;
}

/// <summary>
/// Request to hold/pause a delivery
/// </summary>
public class AdminHoldDeliveryDto
{
    [Required(ErrorMessage = "Reason is required when holding a delivery")]
    public string Reason { get; set; } = null!;
}

/// <summary>
/// Request to resume a held delivery
/// </summary>
public class AdminResumeDeliveryDto
{
    public string? Notes { get; set; }
}

/// <summary>
/// Request to override a delivery status
/// </summary>
public class AdminOverrideStatusDto
{
    [Required(ErrorMessage = "New status is required")]
    public string NewStatus { get; set; } = null!;

    [Required(ErrorMessage = "Reason is required for status override")]
    public string Reason { get; set; } = null!;
}

/// <summary>
/// Request to force close a delivery
/// </summary>
public class AdminForceCloseDto
{
    [Required(ErrorMessage = "Reason is required for force close")]
    public string Reason { get; set; } = null!;
}

/// <summary>
/// Filter for admin delivery queries
/// </summary>
public class DeliveryFilterDto
{
    public string? Status { get; set; }
    public int? SupplierId { get; set; }
    public Guid? WarehouseId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = true;
}

/// <summary>
/// Filter for audit log queries
/// </summary>
public class AuditLogFilterDto
{
    public Guid? ShipmentId { get; set; }
    public Guid? AdminId { get; set; }
    public string? EntityType { get; set; }
    public string? Action { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Admin action log response DTO
/// </summary>
public class AdminActionLogDto
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = null!;
    public string EntityId { get; set; } = null!;
    public Guid AdminId { get; set; }
    public string? AdminName { get; set; }
    public string Action { get; set; } = null!;
    public string? OldStatus { get; set; }
    public string? NewStatus { get; set; }
    public string? Reason { get; set; }
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Delivery KPI per warehouse
/// </summary>
public class DeliveryKpiDto
{
    public Guid? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public int TotalDeliveries { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
    public int DisputedCount { get; set; }
    public int CompletedCount { get; set; }
    public int CancelledCount { get; set; }
    public int OnHoldCount { get; set; }
    public int InProgressCount { get; set; }
    public double AvgApprovalTimeMinutes { get; set; }
    public double SupplierComplianceRate { get; set; }
    public double RejectRate { get; set; }
    public double DisputeRate { get; set; }
    public double OnTimeDeliveryRate { get; set; }
    public DateTime? PeriodFrom { get; set; }
    public DateTime? PeriodTo { get; set; }
}

/// <summary>
/// Extended shipment DTO for admin view (includes governance fields)
/// </summary>
public class AdminDeliveryDetailDto
{
    public Guid Id { get; set; }
    public string ExternalReference { get; set; } = null!;
    public int SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string? SupplierStoreName { get; set; }
    public bool SupplierIsVerified { get; set; }
    public Guid WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public string? WarehouseCode { get; set; }
    public string Status { get; set; } = null!;
    public DateTime ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDispatchDate { get; set; }
    public DateTime? ActualArrivalDate { get; set; }
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public string? Notes { get; set; }
    public decimal? TotalValue { get; set; }
    public int TotalItems { get; set; }
    public int TotalQuantity { get; set; }
    public DateTime CreatedAt { get; set; }

    // Related data
    public List<AdminDeliveryItemDto> Items { get; set; } = new();
    public List<AdminDeliveryDocumentDto> Documents { get; set; } = new();
    public List<AdminDeliveryStatusHistoryDto> StatusHistory { get; set; } = new();
}

public class AdminDeliveryItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductSku { get; set; }
    public int ExpectedQuantity { get; set; }
    public int? ReceivedQuantity { get; set; }
    public int? DamagedQuantity { get; set; }
    public string Uom { get; set; } = null!;
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal? UnitCost { get; set; }
    public decimal? LineTotal { get; set; }
}

public class AdminDeliveryDocumentDto
{
    public Guid Id { get; set; }
    public string DocumentType { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public string FileUrl { get; set; } = null!;
    public string? MimeType { get; set; }
    public long? FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class AdminDeliveryStatusHistoryDto
{
    public Guid Id { get; set; }
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = null!;
    public DateTime? PreviousEta { get; set; }
    public DateTime? NewEta { get; set; }
    public string? Notes { get; set; }
    public string? Location { get; set; }
    public Guid? ChangedBy { get; set; }
    public string? ChangedByName { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Summary DTO for admin delivery list view
/// </summary>
public class AdminDeliverySummaryDto
{
    public Guid Id { get; set; }
    public string ExternalReference { get; set; } = null!;
    public int SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public Guid WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public string Status { get; set; } = null!;
    public DateTime ExpectedDeliveryDate { get; set; }
    public decimal? TotalValue { get; set; }
    public int TotalItems { get; set; }
    public int TotalQuantity { get; set; }
    public DateTime CreatedAt { get; set; }
}
