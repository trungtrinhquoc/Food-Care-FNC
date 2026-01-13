using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class InventoryLog
{
    public Guid Id { get; set; }

    public Guid? ProductId { get; set; }

    public int ChangeAmount { get; set; }

    public string? Reason { get; set; }

    public int CurrentStock { get; set; }

    public Guid? CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Product? Product { get; set; }
}
