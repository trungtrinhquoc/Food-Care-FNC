using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;

namespace FoodCare.API.Models.Suppliers;

[Index("IsActive", "IsVerified", Name = "idx_suppliers_active")]
[Index("SupplierCode", Name = "idx_suppliers_code")]
[Index("Rating", Name = "idx_suppliers_rating", AllDescending = true)]
[Index("IsDeleted", Name = "ix_suppliers_is_deleted")]
[Index("UserId", Name = "ix_suppliers_user_id")]
[Index("SupplierCode", Name = "suppliers_supplier_code_key", IsUnique = true)]
public partial class Supplier {
    [Key]
    public int Id { get; set; }

    [StringLength(150)]
    public string StoreName { get; set; } = null!;

    [StringLength(255)]
    public string? ContactEmail { get; set; }

    [StringLength(20)]
    public string? ContactPhone { get; set; }

    public string? Address { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public Guid? SupplierUuid { get; set; }

    [StringLength(50)]
    public string? SupplierCode { get; set; }

    [StringLength(255)]
    public string? BusinessName { get; set; }

    [StringLength(100)]
    public string? BusinessLicense { get; set; }

    [StringLength(255)]
    public string? ContactName { get; set; }

    [StringLength(500)]
    public string? AddressStreet { get; set; }

    [StringLength(100)]
    public string? AddressWard { get; set; }

    [StringLength(100)]
    public string? AddressDistrict { get; set; }

    [StringLength(100)]
    public string? AddressCity { get; set; }

    [StringLength(50)]
    public string? TaxCode { get; set; }

    [StringLength(50)]
    public string? BankAccount { get; set; }

    [StringLength(255)]
    public string? BankName { get; set; }

    [Precision(3, 2)]
    public decimal? Rating { get; set; }

    public int? TotalOrders { get; set; }

    public int? CompletedOrders { get; set; }

    public int? CancelledOrders { get; set; }

    public TimeSpan? AvgProcessingTime { get; set; }

    [Precision(5, 2)]
    public decimal? SlaComplianceRate { get; set; }

    public int? LateDeliveryCount { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? VerifiedAt { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? SuspendedAt { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? UpdatedAt { get; set; }

    public string? StoreLogoUrl { get; set; }

    public string? StoreBannerUrl { get; set; }

    [StringLength(500)]
    public string? WebsiteUrl { get; set; }

    [Precision(10, 8)]
    public decimal? Latitude { get; set; }

    [Precision(11, 8)]
    public decimal? Longitude { get; set; }

    [StringLength(255)]
    public string? BankBranch { get; set; }

    public int? ReturnedOrders { get; set; }

    [Precision(15, 2)]
    public decimal? TotalRevenue { get; set; }

    [Precision(15, 2)]
    public decimal? TotalCommission { get; set; }

    [Precision(15, 2)]
    public decimal? PendingPayout { get; set; }

    [Precision(5, 2)]
    public decimal? CommissionRate { get; set; }

    public int? LateConfirmationCount { get; set; }

    public int? LatePackingCount { get; set; }

    public int? LateShippingCount { get; set; }

    [Precision(5, 2)]
    public decimal? QualityScore { get; set; }

    public int? IssueCount { get; set; }

    [Precision(5, 2)]
    public decimal? ReturnRate { get; set; }

    [Column(TypeName = "jsonb")]
    public string? Features { get; set; }

    [Column(TypeName = "jsonb")]
    public string? Certifications { get; set; }

    [Column(TypeName = "jsonb")]
    public string? OperatingHours { get; set; }

    [Column(TypeName = "jsonb")]
    public string? ServiceAreas { get; set; }

    [Precision(15, 2)]
    public decimal? MinOrderValue { get; set; }

    public bool? AutoConfirmOrders { get; set; }

    public bool? IsVerified { get; set; }

    public bool? IsFeatured { get; set; }

    public string? SuspensionReason { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? LastActivityAt { get; set; }

    public Guid? UserId { get; set; }

    public DateTime? DeletedAt { get; set; }

    public bool? IsDeleted { get; set; }

    // Business registration fields
    [StringLength(20)]
    public string? RegistrationStatus { get; set; } = "pending";

    public string? RejectionReason { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public Guid? ApprovedBy { get; set; }

    public string? BusinessLicenseUrl { get; set; }

    [StringLength(50)]
    public string? OperatingRegion { get; set; }

    public string? RegistrationNotes { get; set; }

    public DateTime? SubmittedAt { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Suppliers")]
    public virtual User? User { get; set; }

    [InverseProperty("Supplier")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    [InverseProperty("Supplier")]
    public virtual ICollection<SupplierAlert> SupplierAlerts { get; set; } = new List<SupplierAlert>();

    [InverseProperty("Supplier")]
    public virtual ICollection<SupplierOrder> SupplierOrders { get; set; } = new List<SupplierOrder>();

    [InverseProperty("Supplier")]
    public virtual ICollection<SupplierProduct> SupplierProducts { get; set; } = new List<SupplierProduct>();

    [InverseProperty("Supplier")]
    public virtual ICollection<SupplierStats> SupplierStats { get; set; } = new List<SupplierStats>();
}
