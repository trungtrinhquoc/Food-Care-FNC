using System.ComponentModel.DataAnnotations;

namespace FoodCare.API.Models.DTOs.Profile;

public class UpdateProfileRequest
{
    [Required(ErrorMessage = "Họ tên là bắt buộc")]
    [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
    public string FullName { get; set; } = null!;

    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string? Email { get; set; }

    [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
    [StringLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự")]
    public string? PhoneNumber { get; set; }

    public string? AvatarUrl { get; set; }
}

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Mật khẩu hiện tại là bắt buộc")]
    public string CurrentPassword { get; set; } = null!;

    [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
    public string NewPassword { get; set; } = null!;

    [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc")]
    [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp")]
    public string ConfirmPassword { get; set; } = null!;
}

public class AddressRequest
{
    [Required(ErrorMessage = "Tên người nhận là bắt buộc")]
    [StringLength(100, ErrorMessage = "Tên không được vượt quá 100 ký tự")]
    public string RecipientName { get; set; } = null!;

    [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
    [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
    public string PhoneNumber { get; set; } = null!;

    [Required(ErrorMessage = "Địa chỉ là bắt buộc")]
    [StringLength(200, ErrorMessage = "Địa chỉ không được vượt quá 200 ký tự")]
    public string AddressLine1 { get; set; } = null!;

    [StringLength(200, ErrorMessage = "Địa chỉ không được vượt quá 200 ký tự")]
    public string? AddressLine2 { get; set; }

    [Required(ErrorMessage = "Thành phố là bắt buộc")]
    [StringLength(100, ErrorMessage = "Thành phố không được vượt quá 100 ký tự")]
    public string City { get; set; } = null!;

    [StringLength(100, ErrorMessage = "Quận/Huyện không được vượt quá 100 ký tự")]
    public string? District { get; set; }

    [StringLength(100, ErrorMessage = "Phường/Xã không được vượt quá 100 ký tự")]
    public string? Ward { get; set; }

    public bool IsDefault { get; set; } = false;
}

public class PaymentMethodRequest
{
    [Required(ErrorMessage = "Nhà cung cấp thanh toán là bắt buộc")]
    [StringLength(50, ErrorMessage = "Tên nhà cung cấp không được vượt quá 50 ký tự")]
    public string Provider { get; set; } = null!;

    [Required(ErrorMessage = "Token thanh toán là bắt buộc")]
    public string ProviderToken { get; set; } = null!;

    [StringLength(4, MinimumLength = 4, ErrorMessage = "Last4Digits phải có đúng 4 ký tự")]
    public string? Last4Digits { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    public bool IsDefault { get; set; } = false;
}

public class AddressResponse
{
    public Guid Id { get; set; }
    public string RecipientName { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;
    public string AddressLine1 { get; set; } = null!;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = null!;
    public string? District { get; set; }
    public string? Ward { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PaymentMethodResponse
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = null!;
    public string? Last4Digits { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}
