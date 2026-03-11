namespace FoodCare.API.Models.Enums;

/// <summary>
/// Simplified shipment lifecycle statuses.
/// 
/// Flow:
///   Preparing → Delivering → Received → Success
///
/// Exception:
///   Cancelled
/// </summary>
public enum ShipmentStatus
{
    Preparing,
    Delivering,
    Received,
    Success,
    Cancelled
}
