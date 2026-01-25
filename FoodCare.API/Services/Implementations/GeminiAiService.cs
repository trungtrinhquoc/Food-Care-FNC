using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;

namespace FoodCare.API.Services.Implementations;

/// <summary>
/// Wrapper for Google Gemini AI API
/// Cost-optimized with aggressive caching and quota protection
/// </summary>
public class GeminiAiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly ILogger<GeminiAiService> _logger;
    private readonly IMemoryCache _cache;
    
    // Model configuration
    private const string MODEL = "gemini-2.0-flash";
    private const int MAX_TOKENS = 350;
    private const double TEMPERATURE = 0.7;
    
    // Cache keys
    private const string COOLDOWN_KEY = "Gemini_Quota_Cooldown";
    private const string RESPONSE_CACHE_PREFIX = "Chat_AI_Resp_";

    public GeminiAiService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IMemoryCache cache,
        ILogger<GeminiAiService> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _apiKey = configuration["GeminiAI:ApiKey"] ?? throw new InvalidOperationException("GeminiAI:ApiKey not configured");
        _cache = cache;
        _logger = logger;
    }
    
    public async Task<(string response, int tokensUsed)> GenerateResponseAsync(
        string systemPrompt,
        string userMessage,
        List<ChatMessageDto>? conversationHistory = null)
    {
        string normalizedQuestion = userMessage.Trim().ToLower();
        string cacheKey = $"{RESPONSE_CACHE_PREFIX}{normalizedQuestion.GetHashCode()}";
        
        // 1. Check local response cache first (100% free!)
        if (_cache.TryGetValue(cacheKey, out string? cachedResponse))
        {
            _logger.LogInformation("Serving Gemini response from local cache.");
            return (cachedResponse!, 0);
        }

        // 2. Check for Quota Cooldown (Circuit Breaker)
        if (_cache.TryGetValue(COOLDOWN_KEY, out _))
        {
            _logger.LogWarning("Gemini AI is in cooldown due to previous rate limits. Blocking request.");
            return ("Hệ thống AI đang tạm nghỉ để bảo trì hạn mức. Vui lòng thử lại sau 1 phút hoặc hỏi các câu hỏi thường gặp.", 0);
        }

        int retryCount = 0;
        const int maxRetries = 2;
        int delayMs = 10000; // Start with 10s delay if rate limited

        while (true)
        {
            try
            {
                // Use v1beta for Gemini 2.0
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={_apiKey}";
                
                var contents = BuildContents(userMessage, conversationHistory);
                
                var requestBody = new
                {
                    system_instruction = new
                    {
                        parts = new[] { new { text = systemPrompt } }
                    },
                    contents,
                    generationConfig = new
                    {
                        maxOutputTokens = MAX_TOKENS,
                        temperature = TEMPERATURE
                    }
                };
                
                var jsonRequest = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync(url, content);
                
                if ((int)response.StatusCode == 429)
                {
                    // Aggressive cooldown: Set global cooldown for 60 seconds
                    _cache.Set(COOLDOWN_KEY, true, TimeSpan.FromSeconds(60));
                    
                    if (retryCount < maxRetries)
                    {
                        retryCount++;
                        _logger.LogWarning("Gemini API Rate limited (429). Retrying {RetryCount}/{MaxRetries} after {Delay}ms...", retryCount, maxRetries, delayMs);
                        await Task.Delay(delayMs);
                        delayMs += 10000; // Increment backoff
                        continue;
                    }

                    _logger.LogError("Gemini API Quota exhausted for MODEL: {Model}.", MODEL);
                    return ("Hệ thống đang đạt giới hạn câu hỏi. Bạn vui lòng chờ 1 phút rồi hỏi tiếp nhé!", 0);
                }

                response.EnsureSuccessStatusCode();
                
                var jsonResponse = await response.Content.ReadAsStringAsync();
                
                // Use case-insensitive deserialization or PropertyName mapping
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var result = JsonSerializer.Deserialize<GeminiResponse>(jsonResponse, options);
                
                var aiResponse = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text 
                    ?? "Xin lỗi, tôi không thể xử lý yêu cầu này lúc này. Vui lòng thử lại sau.";
                
                // 3. Cache the successful response for 30 minutes
                _cache.Set(cacheKey, aiResponse, TimeSpan.FromMinutes(30));
                
                var tokensUsed = (systemPrompt.Length + userMessage.Length + aiResponse.Length) / 4;
                return (aiResponse, tokensUsed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Gemini AI");
                if (retryCount >= maxRetries) throw;
                
                retryCount++;
                await Task.Delay(2000);
            }
        }
    }
    
    private List<object> BuildContents(string userMessage, List<ChatMessageDto>? history)
    {
        var contents = new List<object>();
        
        // Add conversation history (only last 3 messages to save tokens)
        if (history != null && history.Any())
        {
            var recentHistory = history.TakeLast(3).ToList();
            foreach (var msg in recentHistory)
            {
                contents.Add(new
                {
                    role = msg.Role == "user" ? "user" : "model",
                    parts = new[] { new { text = msg.Content } }
                });
            }
        }
        
        // Add current user message
        contents.Add(new
        {
            role = "user",
            parts = new[] { new { text = userMessage } }
        });
        
        return contents;
    }
    
    // Response models
    private class GeminiResponse
    {
        [JsonPropertyName("candidates")]
        public List<Candidate>? Candidates { get; set; }
    }
    
    private class Candidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }
    }
    
    private class GeminiContent
    {
        [JsonPropertyName("parts")]
        public List<Part>? Parts { get; set; }
    }
    
    private class Part
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }
}

// DTO for chat messages (used internally)
public class ChatMessageDto
{
    public string Role { get; set; } = null!;
    public string Content { get; set; } = null!;
}
