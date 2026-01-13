using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class CouponUsage
{
    public Guid Id { get; set; }

    public int? CouponId { get; set; }

    public Guid? UserId { get; set; }

    public Guid? OrderId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Coupon? Coupon { get; set; }

    public virtual Order? Order { get; set; }

    public virtual User? User { get; set; }
}
