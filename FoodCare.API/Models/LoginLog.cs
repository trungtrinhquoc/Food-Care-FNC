using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodCare.API.Models;

public partial class LoginLog
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public DateTime? LoginAt { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? DeviceType { get; set; }

    public string? DeviceName { get; set; }

    public string? Location { get; set; }

    public string? CountryCode { get; set; }

    public bool? Success { get; set; }

    public string? FailureReason { get; set; }

    public string? SessionId { get; set; }

    public DateTime? CreatedAt { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}
