using FoodCare.API.Models.DTOs.Chat;

namespace FoodCare.API.Services.Interfaces;

public interface IOpenRouterService
{
    Task<(string response, int tokensUsed)> GenerateResponseAsync(
        string systemPrompt,
        string userMessage,
        List<ChatMessageDto>? conversationHistory = null);
}
