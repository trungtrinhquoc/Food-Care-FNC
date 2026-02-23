namespace FoodCare.API.Models.Enums;

/// <summary>
/// Shipment lifecycle statuses
/// </summary>
public enum ShipmentStatus
{
    Draft,
    Dispatched,
    InTransit,
    Arrived,
    Inspected,
    Stored,
    Closed,
    Cancelled
}
