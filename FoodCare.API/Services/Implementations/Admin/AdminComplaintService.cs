using System.Text.Json;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminComplaintService : IAdminComplaintService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<AdminComplaintService> _logger;

    public AdminComplaintService(FoodCareDbContext context, ILogger<AdminComplaintService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<ComplaintDto>> GetComplaintsAsync(ComplaintFilterDto filter)
    {
        var query = _context.Complaints
            .Include(c => c.User)
            .Include(c => c.Order)
            .Include(c => c.Supplier)
            .AsQueryable();

        // Keep platform feedback separate from complaint moderation queue by default.
        if (string.IsNullOrEmpty(filter.Type))
            query = query.Where(c => c.Type != "Góp ý nền tảng");

        if (!string.IsNullOrEmpty(filter.Status))
            query = query.Where(c => c.Status == filter.Status);

        if (!string.IsNullOrEmpty(filter.Priority))
            query = query.Where(c => c.Priority == filter.Priority);

        if (!string.IsNullOrEmpty(filter.Type))
            query = query.Where(c => c.Type == filter.Type);

        // Sort: high priority first, then by created time ascending
        query = query
            .OrderBy(c => c.Priority == "high" ? 0 : c.Priority == "medium" ? 1 : 2)
            .ThenBy(c => c.CreatedAt);

        var totalItems = await query.CountAsync();

        var complaints = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var dtos = complaints.Select(c => MapToDto(c, now)).ToList();

        return new PagedResult<ComplaintDto>
        {
            Items = dtos,
            TotalItems = totalItems,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalItems / filter.PageSize)
        };
    }

    public async Task<ComplaintDto?> GetByIdAsync(Guid id)
    {
        var complaint = await _context.Complaints
            .Include(c => c.User)
            .Include(c => c.Order)
            .Include(c => c.Supplier)
            .FirstOrDefaultAsync(c => c.Id == id);

        return complaint == null ? null : MapToDto(complaint, DateTime.UtcNow);
    }

    public async Task<ComplaintDto> CreateComplaintAsync(CreateComplaintDto dto, Guid userId)
    {
        var complaint = new Complaint
        {
            Id = Guid.NewGuid(),
            OrderNumber = dto.OrderNumber,
            OrderId = dto.OrderId,
            UserId = userId,
            SupplierId = dto.SupplierId,
            Type = dto.Type,
            Priority = DeterminePriority(dto.Type),
            Status = "pending",
            Description = dto.Description,
            ImageUrls = dto.ImageUrls != null ? JsonSerializer.Serialize(dto.ImageUrls) : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Complaints.Add(complaint);
        await _context.SaveChangesAsync();

        // Reload with navigation properties
        var created = await GetByIdAsync(complaint.Id);
        return created!;
    }

    public async Task<List<ComplaintDto>> GetMyComplaintsAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        var complaints = await _context.Complaints
            .Include(c => c.User)
            .Include(c => c.Order)
            .Include(c => c.Supplier)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return complaints.Select(c => MapToDto(c, now)).ToList();
    }

    public async Task<ComplaintDto?> ActionAsync(Guid id, ResolveComplaintDto dto)
    {
        var complaint = await _context.Complaints
            .Include(c => c.User)
            .Include(c => c.Order)
            .Include(c => c.Supplier)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (complaint == null) return null;

        complaint.AdminNote = dto.AdminNote;
        complaint.UpdatedAt = DateTime.UtcNow;

        switch (dto.Action.ToLower())
        {
            case "investigate":
                complaint.Status = "investigating";
                break;
            case "approve":
                complaint.Status = "resolved";
                complaint.RefundAmount = dto.RefundAmount;
                // If refund needed, add to customer account balance
                if (dto.RefundAmount.HasValue && dto.RefundAmount > 0 && complaint.UserId != Guid.Empty)
                {
                    var user = await _context.Users.FindAsync(complaint.UserId);
                    if (user != null)
                    {
                        // AccountBalance is non-nullable decimal
                        user.AccountBalance += dto.RefundAmount.Value;
                    }
                }
                break;
            case "reject":
                complaint.Status = "rejected";
                break;
        }

        await _context.SaveChangesAsync();
        return MapToDto(complaint, DateTime.UtcNow);
    }

    private static string DeterminePriority(string type) => type switch
    {
        "Không nhận hàng" => "high",
        "Hàng hỏng" => "medium",
        "Thiếu sản phẩm" => "medium",
        _ => "low"
    };

    private static ComplaintDto MapToDto(Complaint c, DateTime now)
    {
        List<string> imageUrls = new();
        if (!string.IsNullOrEmpty(c.ImageUrls))
        {
            try { imageUrls = JsonSerializer.Deserialize<List<string>>(c.ImageUrls) ?? new(); }
            catch { imageUrls = new(); }
        }

        // Get customer address from order if available
        string customerAddress = string.Empty;
        if (c.Order?.ShippingAddressSnapshot != null)
        {
            try
            {
                var addr = JsonDocument.Parse(c.Order.ShippingAddressSnapshot);
                var parts = new List<string>();
                if (addr.RootElement.TryGetProperty("addressLine1", out var line1)) parts.Add(line1.GetString() ?? "");
                if (addr.RootElement.TryGetProperty("ward", out var ward)) parts.Add(ward.GetString() ?? "");
                if (addr.RootElement.TryGetProperty("district", out var district)) parts.Add(district.GetString() ?? "");
                customerAddress = string.Join(", ", parts.Where(p => !string.IsNullOrEmpty(p)));
            }
            catch { }
        }

        return new ComplaintDto
        {
            Id = c.Id,
            OrderNumber = c.OrderNumber,
            OrderId = c.OrderId,
            CustomerName = c.User?.FullName ?? c.User?.Email ?? "Khách hàng",
            CustomerAddress = customerAddress,
            SupplierName = c.Supplier?.StoreName ?? "Không xác định",
            Type = c.Type,
            Priority = c.Priority,
            Status = c.Status,
            Description = c.Description,
            ImageUrls = imageUrls,
            AdminNote = c.AdminNote,
            RefundAmount = c.RefundAmount,
            CreatedAt = c.CreatedAt,
            ElapsedMinutes = (int)(now - c.CreatedAt).TotalMinutes,
            ReportedBy = c.Supplier?.StoreName
        };
    }
}
