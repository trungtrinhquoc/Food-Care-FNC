namespace FoodCare.API.Models.Enums;

/// <summary>
/// Status of an inbound receipt per supplier (Phiếu nhập theo NCC)
/// </summary>
public enum InboundReceiptStatus
{
    /// <summary>Đang chờ xác nhận</summary>
    Pending,
    /// <summary>Đã xác nhận</summary>
    Confirmed,
    /// <summary>Đã hoàn thành (đã nhập kho)</summary>
    Completed,
    /// <summary>Đã huỷ</summary>
    Cancelled
}
