using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class ZaloMessagesLog
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public Guid? OrderId { get; set; }

    public int? TemplateId { get; set; }

    public string PhoneSent { get; set; } = null!;

    public string? ZaloMsgId { get; set; }

    public string? Status { get; set; }

    public string? ErrorMessage { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Order? Order { get; set; }

    public virtual ZaloTemplate? Template { get; set; }

    public virtual User? User { get; set; }
}
