using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FoodCare.API.Models.DTOs.Staff;

// =====================================================
// SHIPMENT DTOs
// =====================================================

public class SupplierShipmentDto
{
    public Guid Id { get; set; }
    public string ExternalReference { get; set; } = null!;
    public int SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public Guid WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
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

    // Inbound session link
    public Guid? InboundSessionId { get; set; }
    public string? InboundSessionCode { get; set; }
    public Guid? InboundSessionSupplierId { get; set; }

    public List<ShipmentItemDto> Items { get; set; } = new();
    public List<ShipmentDocumentDto> Documents { get; set; } = new();
}

public class ShipmentItemDto
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
    public DateTime? ManufactureDate { get; set; }
    public decimal? UnitCost { get; set; }
    public decimal? LineTotal { get; set; }
    public string? Notes { get; set; }
}

public class ShipmentDocumentDto
{
    public Guid Id { get; set; }
    public string DocumentType { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public string FileUrl { get; set; } = null!;
    public string? MimeType { get; set; }
    public long? FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class ShipmentStatusHistoryDto
{
    public Guid Id { get; set; }
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = null!;
    public DateTime? PreviousEta { get; set; }
    public DateTime? NewEta { get; set; }
    public string? Notes { get; set; }
    public string? ChangedByName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateShipmentRequest
{
    [Required]
    [StringLength(100)]
    public string ExternalReference { get; set; } = null!;

    [Required]
    public Guid WarehouseId { get; set; }

    [Required]
    public DateTime ExpectedDeliveryDate { get; set; }

    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public string? Notes { get; set; }

    [Required]
    [MinLength(1)]
    public List<CreateShipmentItemRequest> Items { get; set; } = new();

    public List<string>? Documents { get; set; }
}

public class CreateShipmentItemRequest
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [StringLength(50)]
    public string Uom { get; set; } = "pcs";

    [StringLength(100)]
    public string? BatchNumber { get; set; }

    public DateTime? ExpiryDate { get; set; }
    public DateTime? ManufactureDate { get; set; }
    public decimal? UnitCost { get; set; }
    public string? Notes { get; set; }
}

public class UpdateShipmentStatusRequest
{
    [Required]
    public string Status { get; set; } = null!;

    public DateTime? NewEta { get; set; }
    public string? Notes { get; set; }
}

public class ShipmentQueryParams
{
    public int? SupplierId { get; set; }
    public Guid? WarehouseId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = true;
}

// =====================================================
// RECEIPT DTOs
// =====================================================

public class ReceiptDto
{
    public Guid Id { get; set; }
    public string ReceiptNumber { get; set; } = null!;
    public Guid ShipmentId { get; set; }
    public string? ShipmentReference { get; set; }
    public Guid WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public Guid ReceivedBy { get; set; }
    public string? ReceivedByName { get; set; }
    public Guid? InspectedBy { get; set; }
    public string? InspectedByName { get; set; }
    public string Status { get; set; } = null!;
    public DateTime ArrivalDate { get; set; }
    public DateTime? InspectionStart { get; set; }
    public DateTime? InspectionEnd { get; set; }
    public DateTime? StoreDate { get; set; }
    public int TotalExpected { get; set; }
    public int TotalAccepted { get; set; }
    public int TotalDamaged { get; set; }
    public int TotalMissing { get; set; }
    public string? Notes { get; set; }
    public string? InspectionNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ReceiptItemDto> Items { get; set; } = new();
}

public class ReceiptItemDto
{
    public Guid Id { get; set; }
    public Guid ShipmentItemId { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductSku { get; set; }
    public int ExpectedQuantity { get; set; }
    public int ReceivedQuantity { get; set; }
    public int AcceptedQuantity { get; set; }
    public int DamagedQuantity { get; set; }
    public int MissingQuantity { get; set; }
    public int QuarantineQuantity { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string Status { get; set; } = null!;
    public bool QcRequired { get; set; }
    public bool? QcPassed { get; set; }
    public int? QcSampleSize { get; set; }
    public int? QcPassedCount { get; set; }
    public string? QcNotes { get; set; }
    public string? InspectionNotes { get; set; }
}

public class CreateReceiptRequest
{
    [Required]
    public Guid ShipmentId { get; set; }

    [Required]
    public DateTime ArrivalDate { get; set; }

    public string? Notes { get; set; }
}

public class InspectReceiptRequest
{
    public string? InspectionNotes { get; set; }

    [Required]
    [MinLength(1)]
    public List<InspectReceiptItemRequest> Items { get; set; } = new();
}

public class InspectReceiptItemRequest
{
    [Required]
    public Guid ReceiptItemId { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int ReceivedQuantity { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int AcceptedQuantity { get; set; }

    [Range(0, int.MaxValue)]
    public int DamagedQuantity { get; set; } = 0;

    [Range(0, int.MaxValue)]
    public int MissingQuantity { get; set; } = 0;

    [Range(0, int.MaxValue)]
    public int QuarantineQuantity { get; set; } = 0;

    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }

    // QC fields
    public bool? QcPassed { get; set; }
    public int? QcSampleSize { get; set; }
    public int? QcPassedCount { get; set; }
    public string? QcNotes { get; set; }
    public string? InspectionNotes { get; set; }
}

public class ReceiptQueryParams
{
    public Guid? WarehouseId { get; set; }
    public Guid? ShipmentId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// =====================================================
// DISCREPANCY DTOs
// =====================================================

public class DiscrepancyReportDto
{
    public Guid Id { get; set; }
    public string ReportNumber { get; set; } = null!;
    public Guid ShipmentId { get; set; }
    public string? ShipmentReference { get; set; }
    public Guid? ReceiptId { get; set; }
    public string? ReceiptNumber { get; set; }
    public int SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string DiscrepancyType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string Description { get; set; } = null!;
    public int AffectedQuantity { get; set; }
    public decimal? AffectedValue { get; set; }
    public DateTime? SupplierNotifiedAt { get; set; }
    public string? SupplierResponse { get; set; }
    public DateTime? SupplierResponseAt { get; set; }
    public string? ResolutionType { get; set; }
    public string? ResolutionNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedByName { get; set; }
    public string? ReportedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<DiscrepancyItemDto> Items { get; set; } = new();
}

public class DiscrepancyItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public string DiscrepancyType { get; set; } = null!;
    public int ExpectedQuantity { get; set; }
    public int ActualQuantity { get; set; }
    public int DiscrepancyQuantity { get; set; }
    public string? BatchNumber { get; set; }
    public string? Description { get; set; }
    public List<string>? EvidenceUrls { get; set; }
}

public class CreateDiscrepancyReportRequest
{
    [Required]
    public Guid ShipmentId { get; set; }

    public Guid? ReceiptId { get; set; }

    [Required]
    public string DiscrepancyType { get; set; } = null!;

    [Required]
    public string Description { get; set; } = null!;

    [Required]
    [MinLength(1)]
    public List<CreateDiscrepancyItemRequest> Items { get; set; } = new();
}

public class CreateDiscrepancyItemRequest
{
    [Required]
    public Guid ProductId { get; set; }

    public Guid? ShipmentItemId { get; set; }

    [Required]
    public string DiscrepancyType { get; set; } = null!;

    [Required]
    [Range(0, int.MaxValue)]
    public int ExpectedQuantity { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int ActualQuantity { get; set; }

    public string? BatchNumber { get; set; }
    public string? Description { get; set; }
    public List<string>? EvidenceUrls { get; set; }
}

public class ResolveDiscrepancyRequest
{
    [Required]
    public string ResolutionType { get; set; } = null!; // credit, replacement, return, accept_as_is

    public string? ResolutionNotes { get; set; }
}

// =====================================================
// RETURN DTOs
// =====================================================

public class ReturnShipmentDto
{
    public Guid Id { get; set; }
    public string ReturnNumber { get; set; } = null!;
    public Guid OriginalShipmentId { get; set; }
    public string? OriginalShipmentReference { get; set; }
    public Guid? DiscrepancyReportId { get; set; }
    public int SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public Guid WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public string Status { get; set; } = null!;
    public string ReturnReason { get; set; } = null!;
    public string? Description { get; set; }
    public int TotalItems { get; set; }
    public int TotalQuantity { get; set; }
    public decimal? TotalValue { get; set; }
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? SupplierReceivedAt { get; set; }
    public string? CreditStatus { get; set; }
    public decimal? CreditAmount { get; set; }
    public DateTime? CreditIssuedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ReturnItemDto> Items { get; set; } = new();
}

public class ReturnItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public string? BatchNumber { get; set; }
    public string ReturnReason { get; set; } = null!;
    public string? Description { get; set; }
    public decimal? UnitCost { get; set; }
    public decimal? LineTotal { get; set; }
}

public class CreateReturnShipmentRequest
{
    [Required]
    public Guid OriginalShipmentId { get; set; }

    public Guid? DiscrepancyReportId { get; set; }

    [Required]
    public string ReturnReason { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    [MinLength(1)]
    public List<CreateReturnItemRequest> Items { get; set; } = new();
}

public class CreateReturnItemRequest
{
    [Required]
    public Guid ProductId { get; set; }

    public Guid? ShipmentItemId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public string? BatchNumber { get; set; }

    [Required]
    public string ReturnReason { get; set; } = null!;

    public string? Description { get; set; }
    public decimal? UnitCost { get; set; }
}

public class UpdateReturnStatusRequest
{
    [Required]
    public string Status { get; set; } = null!;

    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public DateTime? SupplierReceivedAt { get; set; }
    public string? Notes { get; set; }
}

// =====================================================
// SUPPLIER SHIPMENT REQUESTS (for Supplier Portal)
// =====================================================

public class CreateSupplierShipmentRequest
{
    [Required]
    [StringLength(100)]
    public string ExternalReference { get; set; } = null!;

    /// <summary>
    /// Optional: System auto-assigns warehouse by supplier's region if not provided.
    /// Supplier SHOULD NOT pick warehouse manually.
    /// </summary>
    public Guid? WarehouseId { get; set; }

    /// <summary>
    /// Optional: Link this shipment to an inbound session.
    /// When provided, warehouse is auto-assigned from the session.
    /// </summary>
    public Guid? InboundSessionId { get; set; }

    [Required]
    public DateTime ExpectedDeliveryDate { get; set; }

    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public string? Notes { get; set; }

    /// <summary>
    /// URL of the attached invoice document
    /// </summary>
    public string? InvoiceUrl { get; set; }

    /// <summary>
    /// URL of the attached packing list document
    /// </summary>
    public string? PackingListUrl { get; set; }

    public List<CreateShipmentItemRequest> Items { get; set; } = new();
}

public class UpdateSupplierShipmentRequest
{
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public string? Notes { get; set; }
}

public class AddShipmentItemRequest
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [StringLength(50)]
    public string Uom { get; set; } = "pcs";

    [StringLength(100)]
    public string? BatchNumber { get; set; }

    public DateTime? ExpiryDate { get; set; }
    public DateTime? ManufactureDate { get; set; }
    public decimal? UnitCost { get; set; }
    public string? Notes { get; set; }
}

public class UpdateShipmentItemRequest
{
    [Range(1, int.MaxValue)]
    public int? Quantity { get; set; }

    [StringLength(50)]
    public string? Uom { get; set; }

    [StringLength(100)]
    public string? BatchNumber { get; set; }

    public DateTime? ExpiryDate { get; set; }
    public DateTime? ManufactureDate { get; set; }
    public decimal? UnitCost { get; set; }
    public string? Notes { get; set; }
}

public class AddShipmentDocumentRequest
{
    [Required]
    public string DocumentType { get; set; } = null!; // packing_list, coa, invoice, other

    [Required]
    public string FileName { get; set; } = null!;

    [Required]
    public string FileUrl { get; set; } = null!;

    public string? MimeType { get; set; }
    public long? FileSize { get; set; }
}

public class StartDeliveringRequest
{
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public string? Notes { get; set; }
}

public class ConfirmReceivedRequest
{
    public string? Notes { get; set; }

    [Required]
    [MinLength(1)]
    public List<ReceivedItemRequest> Items { get; set; } = new();
}

public class ReceivedItemRequest
{
    [Required]
    public Guid ShipmentItemId { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int ReceivedQuantity { get; set; }

    [Range(0, int.MaxValue)]
    public int DamagedQuantity { get; set; } = 0;
}

public class CancelShipmentRequest
{
    [Required]
    public string Reason { get; set; } = null!;
}

// =====================================================
// RECEIPT ADDITIONAL REQUESTS
// =====================================================

public class CompleteInspectionRequest
{
    public string? InspectionNotes { get; set; }
    public string? OverallStatus { get; set; } // accepted, partial, rejected
}

// =====================================================
// DISCREPANCY ADDITIONAL REQUESTS
// =====================================================

public class AddDiscrepancyItemRequest
{
    [Required]
    public Guid ProductId { get; set; }

    public Guid? ShipmentItemId { get; set; }

    [Required]
    public string DiscrepancyType { get; set; } = null!;

    [Required]
    [Range(0, int.MaxValue)]
    public int ExpectedQuantity { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int ActualQuantity { get; set; }

    public string? BatchNumber { get; set; }
    public string? Description { get; set; }
    public List<string>? EvidenceUrls { get; set; }
}

public class UpdateDiscrepancyItemRequest
{
    public int? ExpectedQuantity { get; set; }
    public int? ActualQuantity { get; set; }
    public string? Description { get; set; }
    public List<string>? EvidenceUrls { get; set; }
}

public class ApproveDiscrepancyRequest
{
    public string? ApprovalNotes { get; set; }
}

public class RejectDiscrepancyRequest
{
    [Required]
    public string RejectionReason { get; set; } = null!;
}

// =====================================================
// RETURN ADDITIONAL REQUESTS
// =====================================================

public class AddReturnItemRequest
{
    [Required]
    public Guid ProductId { get; set; }

    public Guid? ShipmentItemId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public string? BatchNumber { get; set; }

    [Required]
    public string ReturnReason { get; set; } = null!;

    public string? Description { get; set; }
    public decimal? UnitCost { get; set; }
}

public class UpdateReturnItemRequest
{
    public int? Quantity { get; set; }
    public string? ReturnReason { get; set; }
    public string? Description { get; set; }
}

public class DispatchReturnRequest
{
    [Required]
    public string TrackingNumber { get; set; } = null!;

    public string? Carrier { get; set; }
    public string? Notes { get; set; }
}

public class ConfirmReturnReceivedRequest
{
    [Required]
    public DateTime ReceivedDate { get; set; }

    public string? Notes { get; set; }
}

public class RecordCreditRequest
{
    [Required]
    public decimal CreditAmount { get; set; }

    public string? CreditReference { get; set; }
    public string? Notes { get; set; }
}

public class CancelReturnRequest
{
    [Required]
    public string Reason { get; set; } = null!;
}

// =====================================================
// INVENTORY ADDITIONAL REQUESTS
// =====================================================

public class AdjustInventoryRequest
{
    [Required]
    public int QuantityChange { get; set; }

    [Required]
    public string Reason { get; set; } = null!;

    public string? Notes { get; set; }
    public int? ExpectedVersion { get; set; } // For optimistic locking
}

public class TransferInventoryRequest
{
    [Required]
    public Guid SourceInventoryId { get; set; }

    [Required]
    public Guid TargetWarehouseId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public string? Notes { get; set; }
}

public class QuarantineInventoryRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Required]
    public string Reason { get; set; } = null!;

    public string? Notes { get; set; }
}

public class MarkExpiredRequest
{
    public string? Notes { get; set; }
}

public class ReserveStockRequest
{
    [Required]
    public Guid OrderId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public Guid? WarehouseId { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class PickListRequest
{
    [Required]
    [MinLength(1)]
    public List<PickListItemRequest> Items { get; set; } = new();

    public Guid? WarehouseId { get; set; }
}

public class PickListItemRequest
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}

public class FifoPickDto
{
    public Guid InventoryId { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int AvailableQuantity { get; set; }
    public int PickQuantity { get; set; }
    public string? WarehouseName { get; set; }
    public string? Location { get; set; }
}

public class ExecutePickRequest
{
    [Required]
    public Guid OrderId { get; set; }

    [Required]
    [MinLength(1)]
    public List<ExecutePickItemRequest> Items { get; set; } = new();
}

public class ExecutePickItemRequest
{
    [Required]
    public Guid InventoryId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public bool OverrideFifo { get; set; } = false;
}
