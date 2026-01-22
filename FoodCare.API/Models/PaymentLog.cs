using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodCare.API.Models;

public partial class PaymentLog
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public Guid UserId { get; set; }

    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = null!;

    public string? PaymentMethodName { get; set; }

    public string Status { get; set; } = null!;

    public string? TransactionId { get; set; }

    public string? GatewayResponse { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime? RefundedAt { get; set; }

    public decimal? RefundAmount { get; set; }

    public string? RefundReason { get; set; }

    public string? IpAddress { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey("OrderId")]
    public virtual Order? Order { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}
