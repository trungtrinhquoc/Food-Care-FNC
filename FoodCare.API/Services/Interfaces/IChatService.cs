using FoodCare.API.Models.DTOs.Chat;

namespace FoodCare.API.Services.Interfaces;

/// <summary>
/// Simplified stateless chat service - no conversation/message persistence
/// </summary>
public interface IChatService
{
    /// <summary>
    /// Ask a question and get an answer (stateless - no history saved)
    /// </summary>
    Task<string> AskQuestionAsync(string question, Guid userId);
}

