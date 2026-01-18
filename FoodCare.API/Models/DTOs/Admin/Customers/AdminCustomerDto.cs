namespace FoodCare.API.Models.DTOs.Admin.Customers;

public class AdminCustomerDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public int? TierId { get; set; }
    public int LoyaltyPoints { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminCustomerDetailDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public int? TierId { get; set; }
    public string? TierName { get; set; }
    public int LoyaltyPoints { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<CustomerAddressDto> Addresses { get; set; } = new();
    public List<CustomerOrderSummaryDto> RecentOrders { get; set; } = new();
}

public class CustomerAddressDto
{
    public Guid Id { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? District { get; set; }
    public string? Ward { get; set; }
    public bool IsDefault { get; set; }
}

public class CustomerOrderSummaryDto
{
    public Guid OrderId { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AdminCustomerFilterDto
{
    public string? SearchTerm { get; set; }
    public int? TierId { get; set; }
    public bool? IsActive { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = false;
}
