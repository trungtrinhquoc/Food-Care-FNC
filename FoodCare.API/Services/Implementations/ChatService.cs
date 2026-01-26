using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Chat;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace FoodCare.API.Services.Implementations;

/// <summary>
/// Simplified stateless chat service - no conversation/message persistence
/// </summary>
public class ChatService : IChatService
{
    private readonly FoodCareDbContext _context;
    private readonly FaqCacheService _faqCache;
    private readonly GeminiAiService _geminiAi;
    private readonly MessageClassifier _classifier;


    public ChatService(
        FoodCareDbContext context,
        FaqCacheService faqCache,
        GeminiAiService geminiAi,
        MessageClassifier classifier)
    {
        _context = context;
        _faqCache = faqCache;
        _geminiAi = geminiAi;
        _classifier = classifier;
    }

    public async Task<string> AskQuestionAsync(string question, Guid userId)
    {
        // 1. Check greetings or simple intents first (free!)
        var intent = _classifier.ClassifyIntent(question);
        if (intent == MessageIntent.Greeting)
        {
            return "👋 Xin chào! Tôi là trợ lý AI của Food & Care. Tôi có thể giúp bạn tìm sản phẩm, kiểm tra đơn hàng, hoặc tư vấn về các dịch vụ. Bạn cần gì hôm nay?";
        }

        // 2. Check FAQ cache first (to save API costs)
        var faqAnswer = await _faqCache.FindAnswerAsync(question);

        if (faqAnswer != null)
        {
            return faqAnswer;
        }

        // 3. No FAQ found → Call Gemini AI
        var user = await _context.Users
            .Include(u => u.Tier)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null)
        {
            return "Xin lỗi, không tìm thấy thông tin người dùng.";
        }

        // Build personalized system prompt
        var systemPrompt = $@"Bạn là trợ lý AI chuyên nghiệp của Food & Care - hệ thống cung cấp thực phẩm sạch và dịch vụ subscription.
Khách hàng: {user.FullName ?? "Khách"}
Hạng thành viên: {user.Tier?.Name ?? "Bronze"}
Điểm tích lũy: {user.LoyaltyPoints ?? 0}

Nhiệm vụ: Tư vấn sản phẩm, hỗ trợ đơn hàng, giải thích về Subscription và Membership Tier.
Quy tắc kết thúc: Nếu khách hàng nói ""Không"", ""Cảm ơn"", ""Tạm biệt"" hoặc không cần hỗ trợ gì thêm, hãy gửi một lời chúc tốt lành (ví dụ: ""Chúc anh/chị một ngày tốt lành!"") và nhắc khách hàng liên hệ lại nếu cần.
Phong cách: Thân thiện, lịch sự, ngắn gọn (tối đa 3 câu). Trả lời bằng tiếng Việt.";

        // Call AI with no conversation history (stateless)
        var (aiResponse, _) = await _geminiAi.GenerateResponseAsync(
            systemPrompt,
            question,
            null // No history - stateless
        );

        return aiResponse;
    }
}

