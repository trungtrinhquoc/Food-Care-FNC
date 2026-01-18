using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Zalo;

namespace FoodCare.API.Services.Interfaces.Admin;

public interface IAdminZaloService
{
    Task<PagedResult<ZaloMessageDto>> GetZaloMessagesAsync(ZaloMessageFilterDto filter);
    Task<List<ZaloTemplateDto>> GetZaloTemplatesAsync();
    Task<SendZaloMessageResultDto> SendZaloMessageAsync(SendZaloMessageDto dto);
}
