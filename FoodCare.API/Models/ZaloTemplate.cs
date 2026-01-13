using System;
using System.Collections.Generic;

namespace FoodCare.API.Models;

public partial class ZaloTemplate
{
    public int Id { get; set; }

    public string TemplateId { get; set; } = null!;

    public string? TemplateName { get; set; }

    public string? ContentSample { get; set; }

    public decimal? Price { get; set; }

    public bool? IsActive { get; set; }

    public virtual ICollection<ZaloMessagesLog> ZaloMessagesLogs { get; set; } = new List<ZaloMessagesLog>();
}
