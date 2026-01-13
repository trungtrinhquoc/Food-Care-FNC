using System;
using System.Collections.Generic;
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

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Order? Order { get; set; }
}
