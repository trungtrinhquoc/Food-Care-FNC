namespace FoodCare.API.Models.DTOs.Chat;

/// <summary>
/// Request to ask a question (simplified stateless chat)
/// </summary>
public class AskQuestionRequest
{
    public string Question { get; set; } = string.Empty;
}

/// <summary>
/// Response from chatbot (simplified)
/// </summary>
public class ChatResponseDto
{
    public string Answer { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
