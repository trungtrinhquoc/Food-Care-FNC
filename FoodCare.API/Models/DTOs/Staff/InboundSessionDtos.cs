using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FoodCare.API.Models.DTOs.Staff;

// =====================================================
// INBOUND SESSION DTOs (Phiên nhập kho)
// =====================================================

/// <summary>Response DTO for InboundSession</summary>
public class InboundSessionDto
{
    public Guid Id { get; set; }
    public string SessionCode { get; set; } = null!;
    public Guid WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public Guid CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public Guid? ApprovedBy { get; set; }
    public string? ApprovedByName { get; set; }
    public string Status { get; set; } = null!;
    public string? Note { get; set; }
    public int TotalSuppliers { get; set; }
    public int TotalItems { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<InboundReceiptDto> Receipts { get; set; } = new();
}

/// <summary>Response DTO for InboundReceipt (per supplier)</summary>
public class InboundReceiptDto
{
    public Guid Id { get; set; }
    public string ReceiptCode { get; set; } = null!;
    public Guid SessionId { get; set; }
    public int SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string Status { get; set; } = null!;
    public int TotalItems { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Note { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<InboundReceiptDetailDto> Details { get; set; } = new();
}

/// <summary>Response DTO for InboundReceiptDetail (line item)</summary>
public class InboundReceiptDetailDto
{
    public Guid Id { get; set; }
    public Guid ReceiptId { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public string? Unit { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? ManufactureDate { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

// =====================================================
// REQUEST DTOs
// =====================================================

/// <summary>Create a new inbound session</summary>
public class CreateInboundSessionRequest
{
    [Required]
    public Guid WarehouseId { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }

    /// <summary>Optional expected end date. If set, session will auto-close when this date passes.</summary>
    public DateTime? ExpectedEndDate { get; set; }
}

/// <summary>Add item to an inbound session (system auto-groups by supplier)</summary>
public class AddInboundItemRequest
{
    [Required]
    public Guid ProductId { get; set; }

    /// <summary>SupplierId (int FK). If omitted, uses product's default supplier.</summary>
    public int? SupplierId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; }

    [Range(0, double.MaxValue)]
    public decimal UnitPrice { get; set; }

    [StringLength(50)]
    public string? Unit { get; set; }

    [StringLength(100)]
    public string? BatchNumber { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public DateTime? ManufactureDate { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}

/// <summary>Batch add multiple items at once</summary>
public class AddInboundItemsBatchRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one item is required")]
    public List<AddInboundItemRequest> Items { get; set; } = new();
}

/// <summary>Update an existing detail line</summary>
public class UpdateInboundDetailRequest
{
    [Range(1, int.MaxValue)]
    public int? Quantity { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? UnitPrice { get; set; }

    [StringLength(50)]
    public string? Unit { get; set; }

    [StringLength(100)]
    public string? BatchNumber { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public DateTime? ManufactureDate { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}

/// <summary>Complete/finalize an inbound session</summary>
public class CompleteInboundSessionRequest
{
    [StringLength(500)]
    public string? Note { get; set; }
}

// =====================================================
// AREA-MATCHED PRODUCT DTOs
// =====================================================

/// <summary>
/// Product matched to warehouse area (Ward/City or nearest by distance).
/// Used by staff when adding items to inbound sessions.
/// </summary>
public class AreaMatchedProductDto
{
    public Guid ProductId { get; set; }
    public string Name { get; set; } = null!;
    public decimal BasePrice { get; set; }
    public int SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string? CategoryName { get; set; }
    public string? ImageUrl { get; set; }
    public string? Unit { get; set; }
    public string? Sku { get; set; }
    /// <summary>
    /// Distance in km from warehouse to supplier. 
    /// Null = same Ward (exact match), &gt;0 = distance-based fallback.
    /// </summary>
    public double? DistanceKm { get; set; }
    /// <summary>Match type indicator: "ward" = same Ward, "nearby" = within radius</summary>
    public string MatchType { get; set; } = "ward";
}
