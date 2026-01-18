using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Zalo;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Services.Implementations.Admin;

public class AdminZaloService : IAdminZaloService
{
    private readonly FoodCareDbContext _context;

    public AdminZaloService(FoodCareDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ZaloMessageDto>> GetZaloMessagesAsync(ZaloMessageFilterDto filter)
    {
        var query = _context.ZaloMessagesLogs
            .Include(z => z.User)
            .Include(z => z.Order)
            .Include(z => z.Template)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var searchLower = filter.SearchTerm.ToLower();
            query = query.Where(z => 
                z.PhoneSent.Contains(searchLower) ||
                (z.User != null && z.User.Email.ToLower().Contains(searchLower)));
        }

        if (!string.IsNullOrEmpty(filter.Status))
        {
            query = query.Where(z => z.Status == filter.Status);
        }

        if (filter.TemplateId.HasValue)
        {
            query = query.Where(z => z.TemplateId == filter.TemplateId.Value);
        }

        if (filter.StartDate.HasValue)
        {
            query = query.Where(z => z.CreatedAt >= filter.StartDate.Value);
        }

        if (filter.EndDate.HasValue)
        {
            query = query.Where(z => z.CreatedAt <= filter.EndDate.Value);
        }

        // Apply sorting
        query = filter.SortDescending 
            ? query.OrderByDescending(z => z.CreatedAt) 
            : query.OrderBy(z => z.CreatedAt);

        var totalItems = await query.CountAsync();

        var messages = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(z => new ZaloMessageDto
            {
                Id = z.Id,
                UserEmail = z.User != null ? z.User.Email : null,
                PhoneSent = z.PhoneSent,
                TemplateName = z.Template != null ? z.Template.TemplateName : null,
                Status = z.Status,
                ErrorMessage = z.ErrorMessage,
                SentAt = z.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new PagedResult<ZaloMessageDto>
        {
            Items = messages,
            TotalItems = totalItems,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)filter.PageSize)
        };
    }

    public async Task<List<ZaloTemplateDto>> GetZaloTemplatesAsync()
    {
        var templates = await _context.ZaloTemplates
            .Where(t => t.IsActive == true)
            .Select(t => new ZaloTemplateDto
            {
                Id = t.Id,
                TemplateId = t.TemplateId,
                TemplateName = t.TemplateName,
                ContentSample = t.ContentSample,
                Price = t.Price,
                IsActive = t.IsActive ?? false
            })
            .ToListAsync();

        return templates;
    }

    public async Task<SendZaloMessageResultDto> SendZaloMessageAsync(SendZaloMessageDto dto)
    {
        try
        {
            // Validate template exists
            var template = await _context.ZaloTemplates.FindAsync(dto.TemplateId);
            if (template == null || template.IsActive != true)
            {
                return new SendZaloMessageResultDto
                {
                    Success = false,
                    ErrorMessage = "Template not found or inactive"
                };
            }

            // Create message log
            var messageLog = new ZaloMessagesLog
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                OrderId = dto.OrderId,
                TemplateId = dto.TemplateId,
                PhoneSent = dto.PhoneNumber,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.ZaloMessagesLogs.Add(messageLog);
            await _context.SaveChangesAsync();

            // TODO: Actual Zalo API integration would go here
            // For now, just mark as success
            messageLog.Status = "sent";
            messageLog.ZaloMsgId = Guid.NewGuid().ToString();
            await _context.SaveChangesAsync();

            return new SendZaloMessageResultDto
            {
                Success = true,
                MessageId = messageLog.Id,
                SentAt = messageLog.CreatedAt ?? DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            return new SendZaloMessageResultDto
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }
}
