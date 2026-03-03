using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using FoodCare.API.Services.Interfaces;
using FoodCare.API.Models.DTOs.Chat;

namespace FoodCare.API.Services.Implementations;

/// <summary>
/// OpenRouter wrapper for various AI models
/// OpenAI-compatible API
/// </summary>
public class OpenRouterService : IOpenRouterService
{
    private readonly string _apiKey;
    private readonly string _baseUrl;
    private readonly string _model;
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenRouterService> _logger;
    private readonly IMemoryCache _cache;
    
    // Model configuration
    private const int MAX_TOKENS = 500;
    private const double TEMPERATURE = 0.7;
    
    // Cache keys
    private const string COOLDOWN_KEY = "OpenRouter_Quota_Cooldown";
    private const string RESPONSE_CACHE_PREFIX = "Chat_OR_Resp_";

    public OpenRouterService(
        IConfiguration configuration,
        HttpClient httpClient,
        IMemoryCache cache,
        ILogger<OpenRouterService> logger)
    {
        _apiKey = configuration["OpenRouter:ApiKey"] ?? throw new InvalidOperationException("OpenRouter:ApiKey not configured");
        _baseUrl = configuration["OpenRouter:BaseUrl"] ?? "https://openrouter.ai/api/v1";
        _model = configuration["OpenRouter:Model"] ?? "google/gemini-2.5-flash";
        _httpClient = httpClient;
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
        
        // 1. Check local response cache
        if (_cache.TryGetValue(cacheKey, out string? cachedResponse))
        {
            _logger.LogInformation("Serving OpenRouter response from local cache.");
            return (cachedResponse!, 0);
        }

        // 2. Check for Quota Cooldown
        if (_cache.TryGetValue(COOLDOWN_KEY, out _))
        {
            _logger.LogWarning("OpenRouter AI is in cooldown. Blocking request.");
            return ("Hệ thống AI đang tạm nghỉ. Vui lòng thử lại sau giây lát.", 0);
        }

        int retryCount = 0;
        const int maxRetries = 2;

        while (true)
        {
            try
            {
                var messages = new List<object>();
                
                // Add system prompt
                messages.Add(new { role = "system", content = systemPrompt });
                
                // Add history
                if (conversationHistory != null)
                {
                    foreach (var msg in conversationHistory.TakeLast(5))
                    {
                        messages.Add(new { role = msg.Role, content = msg.Content });
                    }
                }
                
                // Add user message
                messages.Add(new { role = "user", content = userMessage });

                var requestBody = new
                {
                    model = _model,
                    messages = messages,
                    max_tokens = MAX_TOKENS,
                    temperature = TEMPERATURE
                };

                var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/chat/completions");
                request.Headers.Add("Authorization", $"Bearer {_apiKey}");
                request.Headers.Add("HTTP-Referer", "http://localhost:5173"); // Required by OpenRouter
                request.Headers.Add("X-Title", "Food & Care AI"); // Optional for OpenRouter
                
                request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                
                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    _cache.Set(COOLDOWN_KEY, true, TimeSpan.FromSeconds(30));
                    throw new Exception("Rate limited by OpenRouter");
                }

                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                
                var aiResponse = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString() ?? "Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.";

                // 3. Cache the successful response
                _cache.Set(cacheKey, aiResponse, TimeSpan.FromMinutes(30));
                
                return (aiResponse, 0); // OpenRouter returns tokens but we skip for now to simplify
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling OpenRouter");
                
                if (retryCount >= maxRetries)
                {
                    return ("Xin lỗi, có lỗi xảy ra khi kết nối với AI OpenRouter. Vui lòng thử lại sau.", 0);
                }
                
                retryCount++;
                await Task.Delay(1000 * retryCount);
            }
        }
    }
}
