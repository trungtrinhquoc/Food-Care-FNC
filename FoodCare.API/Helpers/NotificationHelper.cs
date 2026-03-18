using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;

namespace FoodCare.API.Helpers;

/// <summary>
/// Helper methods for creating in-app notifications.
/// </summary>
public static class NotificationHelper
{
    /// <summary>
    /// Notify all admin users
    /// </summary>
    public static async Task NotifyAdminsAsync(
        FoodCareDbContext context,
        string title,
        string message,
        string type,
        string? linkUrl = null)
    {
        var adminUserIds = await context.Users
            .Where(u => u.Role == Models.Enums.UserRole.admin && u.IsActive == true)
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var adminId in adminUserIds)
        {
            context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = adminId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                LinkUrl = linkUrl,
                CreatedAt = DateTime.UtcNow
            });
        }
    }
}
