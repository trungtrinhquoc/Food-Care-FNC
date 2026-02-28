namespace FoodCare.API.Models.Enums;

/// <summary>
/// Status of an inbound receiving session (Phiên nhập kho)
/// </summary>
public enum InboundSessionStatus
{
    /// <summary>Phiên mới tạo, đang thêm hàng</summary>
    Draft,
    /// <summary>Đang xử lý nhập kho</summary>
    Processing,
    /// <summary>Đã hoàn thành nhập kho</summary>
    Completed,
    /// <summary>Đã huỷ phiên</summary>
    Cancelled
}
