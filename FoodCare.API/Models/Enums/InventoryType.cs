namespace FoodCare.API.Models.Enums;

/// <summary>
/// Inventory subtypes for segregation
/// </summary>
public enum InventoryType
{
    Available,     // Normal available stock
    Reserved,      // Reserved for orders
    Quarantine,    // Under inspection/quality hold
    Damaged,       // Damaged goods
    Expired        // Expired goods pending disposal
}
