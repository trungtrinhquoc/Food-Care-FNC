using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class MemberTier
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int MinPoint { get; set; }

    public decimal? DiscountPercent { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
