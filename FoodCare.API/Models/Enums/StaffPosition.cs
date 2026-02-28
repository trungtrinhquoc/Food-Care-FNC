using System.Text.Json.Serialization;

namespace FoodCare.API.Models.Enums;

/// <summary>
/// Staff position hierarchy within a warehouse.
/// Only WarehouseManager, AssistantManager, and Supervisor can access the staff system.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StaffPosition
{
    /// <summary>Trưởng phòng kho — Quản lý toàn bộ hoạt động kho</summary>
    WarehouseManager = 1,

    /// <summary>Phó quản lý kho — Hỗ trợ Warehouse Manager, giám sát khu vực</summary>
    AssistantManager = 2,

    /// <summary>Tổ trưởng / Giám sát kho — Quản lý trực tiếp nhân viên kho</summary>
    Supervisor = 3,

    /// <summary>Nhân viên kiểm soát tồn kho — Theo dõi số lượng tồn, kiểm kê</summary>
    InventoryController = 4,

    /// <summary>Nhân viên kho — Nhập/xuất hàng, đóng gói, dán nhãn</summary>
    WarehouseStaff = 5,

    /// <summary>Nhân viên bốc xếp / vận hành thiết bị — Xe nâng, bốc dỡ</summary>
    Loader = 6
}
