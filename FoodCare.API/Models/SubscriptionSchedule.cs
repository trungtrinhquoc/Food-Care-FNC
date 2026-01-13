using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class SubscriptionSchedule
{
    public Guid Id { get; set; }

    public Guid? SubscriptionId { get; set; }

    public DateOnly ScheduledDate { get; set; }

    public bool? IsProcessed { get; set; }

    public Guid? OrderId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Order? Order { get; set; }

    public virtual Subscription? Subscription { get; set; }
}
