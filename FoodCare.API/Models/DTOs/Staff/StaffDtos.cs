using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FoodCare.API.Models.DTOs.Staff;

// =====================================================
// WAREHOUSE DTOs
// =====================================================

public class WarehouseDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Region { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int? Capacity { get; set; }
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateWarehouseRequest
{
    [Required]
    [StringLength(50)]
    public string Code { get; set; } = null!;

    [Required]
    [StringLength(255)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    /// <summary>
    /// Region: North, Central, South
    /// </summary>
    [StringLength(50)]
    public string? Region { get; set; }

    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int? Capacity { get; set; }
    public bool IsDefault { get; set; } = false;
}

public class UpdateWarehouseRequest
{
    [StringLength(255)]
    public string? Name { get; set; }
    public string? Description { get; set; }
    [StringLength(50)]
    public string? Region { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int? Capacity { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsDefault { get; set; }
}

// =====================================================
// STAFF MEMBER DTOs
// =====================================================

public class StaffMemberDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string EmployeeCode { get; set; } = null!;
    public string? Department { get; set; }
    public string? Position { get; set; }
    public Guid? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public bool CanApproveReceipts { get; set; }
    public bool CanAdjustInventory { get; set; }
    public bool CanOverrideFifo { get; set; }
    public DateTime? HireDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // User info
    public string? UserFullName { get; set; }
    public string? UserEmail { get; set; }
    public string? UserPhone { get; set; }
    public string? UserAvatarUrl { get; set; }
}

public class CreateStaffMemberRequest
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [StringLength(50)]
    public string EmployeeCode { get; set; } = null!;

    public string? Department { get; set; }
    public string? Position { get; set; }
    public Guid? WarehouseId { get; set; }
    public bool CanApproveReceipts { get; set; } = false;
    public bool CanAdjustInventory { get; set; } = false;
    public bool CanOverrideFifo { get; set; } = false;
    public DateTime? HireDate { get; set; }
}

public class UpdateStaffMemberRequest
{
    public string? Department { get; set; }
    public string? Position { get; set; }
    public Guid? WarehouseId { get; set; }
    public bool? CanApproveReceipts { get; set; }
    public bool? CanAdjustInventory { get; set; }
    public bool? CanOverrideFifo { get; set; }
    public bool? IsActive { get; set; }
}

// =====================================================
// INVENTORY DTOs
// =====================================================

public class WarehouseInventoryDto
{
    public Guid Id { get; set; }
    public Guid WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductSku { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? ManufactureDate { get; set; }
    public string InventoryType { get; set; } = null!;
    public int Quantity { get; set; }
    public int ReservedQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public decimal? UnitCost { get; set; }
    public string? LocationCode { get; set; }
    public string? Location { get; set; }
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public int? ReorderPoint { get; set; }
    public int? ReorderQuantity { get; set; }
    public int? MinStockLevel { get; set; }
    public int? MaxStockLevel { get; set; }
    public int Version { get; set; }
    public bool IsLowStock { get; set; }
    public bool IsExpiringSoon { get; set; }
    public int? DaysUntilExpiry { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class InventoryQueryParams
{
    public Guid? WarehouseId { get; set; }
    public Guid? ProductId { get; set; }
    public string? BatchNumber { get; set; }
    public string? InventoryType { get; set; }
    public bool? LowStockOnly { get; set; }
    public bool? ExpiringSoonOnly { get; set; }
    public int? ExpiringSoonDays { get; set; } = 30;
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = false;
}

// Note: AdjustInventoryRequest is defined in ShipmentDtos.cs

// =====================================================
// STOCK MOVEMENT DTOs
// =====================================================

public class StockMovementDto
{
    public Guid Id { get; set; }
    public Guid InventoryId { get; set; }
    public Guid WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public string MovementType { get; set; } = null!;
    public int QuantityChange { get; set; }
    public int QuantityBefore { get; set; }
    public int QuantityAfter { get; set; }
    public string? BatchNumber { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public decimal? UnitCost { get; set; }
    public decimal? TotalCost { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public Guid PerformedBy { get; set; }
    public string? PerformedByName { get; set; }
    public Guid? ApprovedBy { get; set; }
    public string? ApprovedByName { get; set; }
    public bool IsFifoOverride { get; set; }
    public string? OverrideReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StockMovementQueryParams
{
    public Guid? WarehouseId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? InventoryId { get; set; }
    public string? MovementType { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// =====================================================
// STOCK RESERVATION DTOs
// =====================================================

public class StockReservationDto
{
    public Guid Id { get; set; }
    public Guid InventoryId { get; set; }
    public Guid? OrderId { get; set; }
    public int Quantity { get; set; }
    public int TotalQuantity { get; set; }
    public int ReservedItems { get; set; }
    public string? ProductName { get; set; }
    public string Status { get; set; } = null!;
    public DateTime ReservedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? FulfilledAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? Notes { get; set; }
}

public class CreateReservationRequest
{
    [Required]
    public Guid InventoryId { get; set; }

    public Guid? OrderId { get; set; }
    public Guid? OrderItemId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public DateTime? ExpiresAt { get; set; }
    public string? Notes { get; set; }
}

// =====================================================
// PAGINATION RESPONSE
// =====================================================

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
