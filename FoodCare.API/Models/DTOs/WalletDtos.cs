using System;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models.DTOs;

public class WalletBalanceDto
{
    public decimal Balance { get; set; }
}

public class WalletTransactionDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TopUpRequestDto
{
    public decimal Amount { get; set; }
}

/// <summary>
/// Dùng nội bộ để trừ/cộng tiền
/// </summary>
public class AdjustBalanceDto
{
    public Guid UserId { get; set; }
    public decimal Amount { get; set; }
    public WalletTransactionType Type { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// Request body cho endpoint thanh toán đơn hàng bằng ví FNC Pay
/// </summary>
public class WalletPayOrderRequestDto
{
    public Guid OrderId { get; set; }
}

