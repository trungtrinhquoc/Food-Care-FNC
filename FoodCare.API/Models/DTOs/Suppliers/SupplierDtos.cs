namespace FoodCare.API.Models.DTOs.Suppliers;

// ===== SUPPLIER DTOs =====

public class SupplierDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? ContactPerson { get; set; }
    public string? TaxCode { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ProductCount { get; set; }
}

public class SupplierProfileDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string? ContactPerson { get; set; }
    public string? TaxCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ProductCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
}

public class CreateSupplierDto
{
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? ContactPerson { get; set; }
    public string? TaxCode { get; set; }
    public bool? IsActive { get; set; }
    public Guid? UserId { get; set; }
}

public class UpdateSupplierDto
{
    public string? Name { get; set; }
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string? ContactPerson { get; set; }
    public string? TaxCode { get; set; }
    public bool? IsActive { get; set; }
}

public class SupplierFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = false;
}

// ===== SUPPLIER PRODUCT DTOs =====

public class SupplierProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? Price { get; set; }
    public decimal? Cost { get; set; }
    public int StockQuantity { get; set; }
    public int? Stock { get; set; }
    public int? MinStock { get; set; }
    public int? MaxStock { get; set; }
    public string? Sku { get; set; }
    public string? Category { get; set; }
    public string? Image { get; set; }
    public string[]? Images { get; set; }
    public bool IsActive { get; set; }
    public string? Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int OrderCount { get; set; }
    public int? SoldCount { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class CreateSupplierProductDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Manufacturer { get; set; }
    public string? Origin { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? Cost { get; set; }
    public int StockQuantity { get; set; }
    public int? MinStock { get; set; }
    public int? MaxStock { get; set; }
    public string? Sku { get; set; }
    public int? CategoryId { get; set; }
    public string[]? Images { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiryDate { get; set; }
}

public class UpdateSupplierProductDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Manufacturer { get; set; }
    public string? Origin { get; set; }
    public decimal? BasePrice { get; set; }
    public decimal? Cost { get; set; }
    public int? StockQuantity { get; set; }
    public int? MinStock { get; set; }
    public int? MaxStock { get; set; }
    public string? Sku { get; set; }
    public int? CategoryId { get; set; }
    public string[]? Images { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public class UpdateStockDto
{
    public int Quantity { get; set; }
    public string? Reason { get; set; }
}

// ===== SUPPLIER ORDER DTOs =====

public class SupplierOrderDto
{
    public string Id { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public int ItemCount { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public AddressDto? ShippingAddress { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class SupplierOrderDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string? OrderNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public AddressDto? ShippingAddress { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public ShippingInfoDto? Shipping { get; set; }
    public string? Notes { get; set; }
}

public class AddressDto
{
    public string? Street { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Country { get; set; }
    public string? Ward { get; set; }
    public string? District { get; set; }
}

public class OrderItemDto
{
    public string Id { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal TotalPrice { get; set; }
}

public class ShippingInfoDto
{
    public string? Carrier { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTime? EstimatedDelivery { get; set; }
    public decimal? Cost { get; set; }
    public string? Notes { get; set; }
    public List<ShippingTimelineDto>? Timeline { get; set; }
}

public class ShippingTimelineDto
{
    public DateTime Date { get; set; }
    public string? Timestamp { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? DeliveryPhotoUrl { get; set; }  // Required when Status = "delivered"
    public string? Reason { get; set; }             // Required when Status = "cancelled"
}

public class AddShippingInfoDto
{
    public string TrackingNumber { get; set; } = string.Empty;
    public string Carrier { get; set; } = string.Empty;
    public DateTime? EstimatedDelivery { get; set; }
    public decimal? Cost { get; set; }
    public string? Notes { get; set; }
}

public class BulkConfirmOrdersDto
{
    public List<string> OrderIds { get; set; } = new();
}

public class CancelOrderDto
{
    public string Reason { get; set; } = string.Empty;
}

// ===== SUPPLIER STATS DTOs =====

public class SupplierStatsDto
{
    public int TotalProducts { get; set; }
    public int ActiveProducts { get; set; }
    public int LowStockProducts { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal ThisMonthRevenue { get; set; }
    public decimal LastMonthRevenue { get; set; }
    public int CompletedOrders { get; set; }
    public int CancelledOrders { get; set; }
    public int ShippingOrders { get; set; }
    public int ConfirmedOrders { get; set; }
    public int OutOfStockProducts { get; set; }
    public decimal TodayRevenue { get; set; }
}

// ===== SUPPLIER ALERT DTOs =====

public class SupplierAlertDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // low_stock, new_order, shipping_delay, payment_issue, system
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "medium"; // low, medium, high, critical
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public Dictionary<string, object>? Data { get; set; }
}

// ===== REVENUE DTOs =====

public class RevenueDataDto
{
    public List<DailyRevenueDto> DailyRevenue { get; set; } = new();
    public List<MonthlyRevenueDto> MonthlyRevenue { get; set; } = new();
    public List<CategoryRevenueDto> CategoryRevenue { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
}

public class DailyRevenueDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class MonthlyRevenueDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
    public int Year { get; set; }
    public int MonthNumber { get; set; }
}

public class CategoryRevenueDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public decimal Percentage { get; set; }
}

public class TopProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Quantity { get; set; }
}

// ===== REVIEW DTOs =====

public class SupplierReviewDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerAvatar { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string? Images { get; set; }
    public bool IsVerifiedPurchase { get; set; }
    public string? ReplyComment { get; set; }
    public DateTime? ReplyAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? OrderId { get; set; }
}

public class RespondToReviewDto
{
    public string ReplyComment { get; set; } = string.Empty;
}

public class ReviewStatsDto
{
    public int TotalReviews { get; set; }
    public double AverageRating { get; set; }
    public Dictionary<int, int> RatingDistribution { get; set; } = new();
    public int PendingReplies { get; set; }
    public double ResponseRate { get; set; }
}

// ===== SUPPLIER BUSINESS REGISTRATION DTOs =====

public class SupplierRegistrationDto
{
    public int SupplierId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string? BusinessName { get; set; }
    public string? BusinessLicense { get; set; }
    public string? BusinessLicenseUrl { get; set; }
    public string? TaxCode { get; set; }
    public string? OperatingRegion { get; set; }
    public string? ContactName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string RegistrationStatus { get; set; } = "pending";
    public string? RejectionReason { get; set; }
    public string? RegistrationNotes { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public bool IsVerified { get; set; }
}

public class SubmitRegistrationDto
{
    public string BusinessName { get; set; } = string.Empty;
    public string BusinessLicense { get; set; } = string.Empty;
    public string? BusinessLicenseUrl { get; set; }
    public string TaxCode { get; set; } = string.Empty;
    public string OperatingRegion { get; set; } = string.Empty;
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressWard { get; set; }
    public string? AddressDistrict { get; set; }
    public string? AddressCity { get; set; }
    public string? RegistrationNotes { get; set; }
}

// ===== ADMIN APPROVAL DTOs =====

public class AdminApproveProductDto
{
    public string Action { get; set; } = string.Empty; // "approve" or "reject"
    public string? Notes { get; set; }
}

public class AdminApproveSupplierDto
{
    public string Action { get; set; } = string.Empty; // "approve" or "reject"
    public string? Reason { get; set; }
}

public class PendingProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public string? Sku { get; set; }
    public string? ImageUrl { get; set; }
    public string? CategoryName { get; set; }
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string ApprovalStatus { get; set; } = "pending";
    public string? ApprovalNotes { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class PendingSupplierDto
{
    public int Id { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string? BusinessName { get; set; }
    public string? BusinessLicense { get; set; }
    public string? BusinessLicenseUrl { get; set; }
    public string? TaxCode { get; set; }
    public string? OperatingRegion { get; set; }
    public string? ContactName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? AddressCity { get; set; }
    public string RegistrationStatus { get; set; } = "pending";
    public string? RejectionReason { get; set; }
    public string? RegistrationNotes { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
}

// ===== NEAR-EXPIRY & SLA DTOs =====

public class NearExpiryProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int DaysUntilExpiry { get; set; }
    public string? ImageUrl { get; set; }
    public decimal BasePrice { get; set; }
}

public class SupplierSlaDto
{
    public decimal SlaComplianceRate { get; set; }
    public decimal Rating { get; set; }
    public int TotalOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int CancelledOrders { get; set; }
    public decimal OrderSuccessRate { get; set; }
    public int LateDeliveryCount { get; set; }
    public int LateConfirmationCount { get; set; }
    public decimal QualityScore { get; set; }
    public decimal ReturnRate { get; set; }
    public bool SlaCompliant { get; set; }
    public bool RatingOk { get; set; }
}

public class CreateSupplierBlindBoxDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal OriginalValue { get; set; }
    public decimal BlindBoxPrice { get; set; }
    public int Quantity { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string? Contents { get; set; }
    public string? ImageUrl { get; set; }
}

// ===== DELIVERY BATCH DTOs (spec 3.3) =====

public class DeliveryBatchDto
{
    public string District { get; set; } = string.Empty;
    public string? Ward { get; set; }
    public int OrderCount { get; set; }
    public decimal TotalAmount { get; set; }
    public List<BatchOrderDto> Orders { get; set; } = new();
}

public class BatchOrderDto
{
    public string Id { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
