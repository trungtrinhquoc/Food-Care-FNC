using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class ReviewHelpful
{
    public Guid Id { get; set; }

    public Guid? ReviewId { get; set; }

    public Guid? UserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Review? Review { get; set; }

    public virtual User? User { get; set; }
}
