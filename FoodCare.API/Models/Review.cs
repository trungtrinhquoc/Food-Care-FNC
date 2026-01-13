using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class Review
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public Guid? ProductId { get; set; }

    public Guid? OrderId { get; set; }

    public int? Rating { get; set; }

    public string? Comment { get; set; }

    public string? Images { get; set; }

    public bool? IsVerifiedPurchase { get; set; }

    public string? ReplyComment { get; set; }

    public DateTime? ReplyAt { get; set; }

    public bool? IsHidden { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Order? Order { get; set; }

    public virtual Product? Product { get; set; }

    public virtual ICollection<ReviewHelpful> ReviewHelpfuls { get; set; } = new List<ReviewHelpful>();

    public virtual User? User { get; set; }
}
