namespace FoodCare.API.Models.Enums;

/// <summary>
/// Types of discrepancies in shipment/receipt
/// </summary>
public enum DiscrepancyType
{
    quantity_short,      // Less than expected
    quantity_over,       // More than expected
    damaged,             // Items damaged
    quality_failed,      // Failed QC inspection
    wrong_item,          // Wrong product delivered
    wrong_batch,         // Batch mismatch
    expired,             // Items already expired
    missing_documents,   // Missing required documents
    other
}
