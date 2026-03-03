using System;
using System.ComponentModel.DataAnnotations;

namespace FoodCare.API.Models.DTOs.Staff;

// =====================================================
// SUPPLIER-FACING INBOUND SESSION DTOs
// =====================================================

/// <summary>Session info visible to suppliers (limited view)</summary>
public class SupplierInboundSessionDto
{
    public Guid SessionId { get; set; }
    public string SessionCode { get; set; } = null!;
    public string? WarehouseName { get; set; }
    public string? WarehouseWard { get; set; }
    public string? WarehouseDistrict { get; set; }
    public string? WarehouseCity { get; set; }
    public string? WarehouseAddress { get; set; }
    public string SessionStatus { get; set; } = null!;
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime CreatedAt { get; set; }

    // Supplier's registration info for this session
    public Guid? RegistrationId { get; set; }
    public string RegistrationStatus { get; set; } = null!;
    public string? RegistrationNote { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
    public DateTime? RegisteredAt { get; set; }
}

/// <summary>Request for supplier to register for an inbound session</summary>
public class SupplierRegisterInboundRequest
{
    [StringLength(500)]
    public string? Note { get; set; }

    public DateTime? EstimatedDeliveryDate { get; set; }
}

/// <summary>DTO for admin to see supplier registrations for a session</summary>
public class InboundSessionSupplierDto
{
    public Guid RegistrationId { get; set; }
    public int SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string? SupplierPhone { get; set; }
    public string? SupplierEmail { get; set; }
    public string? SupplierWard { get; set; }
    public string? SupplierDistrict { get; set; }
    public string Status { get; set; } = null!;
    public string? Note { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
    public DateTime? RegisteredAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
