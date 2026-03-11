using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.Staff;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Helpers;

/// <summary>
/// Helper methods for creating in-app notifications for delivery workflow events.
/// </summary>
public static class NotificationHelper
{
    /// <summary>
    /// Create a delivery notification for the supplier (sent to their user account)
    /// </summary>
    public static async Task CreateDeliveryNotificationAsync(
        FoodCareDbContext context,
        SupplierShipment shipment,
        Supplier supplier,
        string title,
        string message,
        string type)
    {
        if (supplier.UserId == default) return;

        context.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = supplier.UserId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            LinkUrl = $"/supplier/shipments?id={shipment.Id}",
            CreatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Notify all staff assigned to a warehouse
    /// </summary>
    public static async Task NotifyWarehouseStaffAsync(
        FoodCareDbContext context,
        Guid warehouseId,
        string title,
        string message,
        string type,
        string? linkUrl = null)
    {
        var staffUserIds = await context.StaffWarehouses
            .Where(sw => sw.WarehouseId == warehouseId)
            .Include(sw => sw.Staff)
            .Select(sw => sw.Staff.UserId)
            .ToListAsync();

        foreach (var userId in staffUserIds)
        {
            context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                LinkUrl = linkUrl,
                CreatedAt = DateTime.UtcNow
            });
        }
    }

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

    /// <summary>
    /// Create an incoming delivery notification for warehouse staff
    /// </summary>
    public static async Task NotifyIncomingDeliveryAsync(
        FoodCareDbContext context,
        SupplierShipment shipment,
        string supplierName)
    {
        await NotifyWarehouseStaffAsync(context, shipment.WarehouseId,
            "Đơn giao hàng sắp đến",
            $"Đơn hàng {shipment.ExternalReference} từ {supplierName} dự kiến đến ngày {shipment.ExpectedDeliveryDate:dd/MM/yyyy}.",
            "delivery_incoming",
            $"/staff/shipments/{shipment.Id}");
    }

    /// <summary>
    /// Notify admins about an anomaly
    /// </summary>
    public static async Task NotifyDeliveryAnomalyAsync(
        FoodCareDbContext context,
        SupplierShipment shipment,
        string anomalyType,
        string details)
    {
        await NotifyAdminsAsync(context,
            $"Bất thường giao hàng: {anomalyType}",
            $"Đơn {shipment.ExternalReference}: {details}",
            "delivery_anomaly",
            $"/admin/deliveries?id={shipment.Id}");
    }
}
