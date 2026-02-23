namespace FoodCare.API.Models.Enums;

/// <summary>
/// Receipt/Inspection statuses
/// </summary>
public enum ReceiptStatus
{
    Pending,
    Inspecting,
    Accepted,
    Partial,
    Rejected,
    Quarantine,
    Completed
}
