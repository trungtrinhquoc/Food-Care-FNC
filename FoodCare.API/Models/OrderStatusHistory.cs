using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Models;

public partial class OrderStatusHistory
{
    public Guid Id { get; set; }

    public Guid? OrderId { get; set; }

    public OrderStatus? PreviousStatus { get; set; }

    public OrderStatus NewStatus { get; set; }

    public string? Note { get; set; }

    public Guid? CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Alias for NewStatus for service compatibility
    /// </summary>
    [NotMapped]
    public OrderStatus Status
    {
        get => NewStatus;
        set => NewStatus = value;
    }

    /// <summary>
    /// Alias for CreatedAt for service compatibility
    /// </summary>
    [NotMapped]
    public DateTime? ChangedAt
    {
        get => CreatedAt;
        set => CreatedAt = value;
    }

    /// <summary>
    /// String representation of who changed the status
    /// </summary>
    [NotMapped]
    public string? ChangedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Order? Order { get; set; }
}

