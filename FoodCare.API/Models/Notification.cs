using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class Notification
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    public string? Type { get; set; }

    public bool? IsRead { get; set; }

    public string? LinkUrl { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User? User { get; set; }
}
