namespace FoodCare.API.Models.Enums;

/// <summary>
/// Types of stock movements
/// </summary>
public enum MovementType
{
    Inbound,           // Receiving from supplier
    Outbound,          // Delivery to customer/warehouse
    Transfer,          // Transfer between warehouses
    Adjustment,        // Manual adjustment
    ReturnIn,          // Return from customer
    ReturnOut,         // Return to supplier
    QuarantineIn,      // Move to quarantine
    QuarantineOut,     // Release from quarantine
    Expired,           // Write-off due to expiry
    Damaged,           // Write-off due to damage
    Reserved,          // Stock reservation
    Unreserved         // Release reservation
}
