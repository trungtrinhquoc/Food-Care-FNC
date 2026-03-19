using FoodCare.API.Models.DTOs.Admin;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminComplaintService
{
    Task<PagedResult<ComplaintDto>> GetComplaintsAsync(ComplaintFilterDto filter);
    Task<ComplaintDto?> GetByIdAsync(Guid id);
    Task<ComplaintDto> CreateComplaintAsync(CreateComplaintDto dto, Guid userId);
    Task<List<ComplaintDto>> GetMyComplaintsAsync(Guid userId);
    Task<ComplaintDto?> ActionAsync(Guid id, ResolveComplaintDto dto);
}
