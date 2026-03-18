namespace FoodCare.API.Models.DTOs.Admin;

public class FinanceSummaryDto
{
    public decimal Gmv { get; set; }
    public decimal FAndCRevenue { get; set; }
    public decimal TotalWalletBalance { get; set; }
    public decimal TotalRefunded { get; set; }
    public decimal WalletReserveMin { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
}

public class MartSettlementDto
{
    public int SupplierId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public decimal TotalSales { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal AmountDue { get; set; }
    public bool IsPaid { get; set; }
}
