using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodCare.API.Models;

public partial class PointsHistory
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public int Points { get; set; }

    public string Type { get; set; } = null!;

    public string? Description { get; set; }

    public Guid? OrderId { get; set; }

    public int BalanceBefore { get; set; }

    public int BalanceAfter { get; set; }

    public Guid? CreatedBy { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("OrderId")]
    public virtual Order? Order { get; set; }

    [ForeignKey("CreatedBy")]
    public virtual User? CreatedByUser { get; set; }
}
