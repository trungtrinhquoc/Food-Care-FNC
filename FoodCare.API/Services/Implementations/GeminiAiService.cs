using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Google.Cloud.AIPlatform.V1;
using Google.Protobuf.WellKnownTypes;
using Value = Google.Protobuf.WellKnownTypes.Value;

namespace FoodCare.API.Services.Implementations;

/// <summary>
/// Vertex AI wrapper for Google Gemini models
/// Cost-optimized with aggressive caching and quota protection
/// </summary>
public class GeminiAiService
{
    private readonly string _projectId;
    private readonly string _location;
    private readonly string _model;
    private readonly ILogger<GeminiAiService> _logger;
    private readonly IMemoryCache _cache;
    
    // Model configuration
    private const int MAX_TOKENS = 350;
    private const double TEMPERATURE = 0.9;
    
    // Cache keys
    private const string COOLDOWN_KEY = "Gemini_Quota_Cooldown";
    private const string RESPONSE_CACHE_PREFIX = "Chat_AI_Resp_";

    public GeminiAiService(
        IConfiguration configuration,
        IMemoryCache cache,
        ILogger<GeminiAiService> logger)
    {
        _projectId = configuration["VertexAI:ProjectId"] ?? throw new InvalidOperationException("VertexAI:ProjectId not configured");
        _location = configuration["VertexAI:Location"] ?? "us-central1";
        _model = configuration["VertexAI:Model"] ?? "gemini-2.5-flash-lite";
        _cache = cache;
        _logger = logger;
        
        // Set credentials path if provided
        var credentialsPath = configuration["VertexAI:CredentialsPath"];
        if (!string.IsNullOrEmpty(credentialsPath) && File.Exists(credentialsPath))
        {
            Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", credentialsPath);
        }
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
                // Create Vertex AI client
                var client = new PredictionServiceClientBuilder
                {
                    Endpoint = $"{_location}-aiplatform.googleapis.com"
                }.Build();
                
                // Build endpoint name
                var endpoint = $"projects/{_projectId}/locations/{_location}/publishers/google/models/{_model}";
                
                // Build contents
                var contents = BuildContents(userMessage, conversationHistory);
                
                // Build request
                var generateContentRequest = new GenerateContentRequest
                {
                    Model = endpoint,
                    SystemInstruction = new Content
                    {
                        Parts = { new Part { Text = systemPrompt } }
                    },
                    GenerationConfig = new GenerationConfig
                    {
                        MaxOutputTokens = MAX_TOKENS,
                        Temperature = (float)TEMPERATURE
                    }
                };
                
                // Add contents
                foreach (var content in contents)
                {
                    generateContentRequest.Contents.Add(content);
                }
                
                // Call Vertex AI
                var response = await client.GenerateContentAsync(generateContentRequest);
                
                // Extract response text
                var aiResponse = response.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text 
                    ?? "Xin lỗi, tôi không thể xử lý yêu cầu này lúc này. Vui lòng thử lại sau.";
                
                // 3. Cache the successful response for 30 minutes
                _cache.Set(cacheKey, aiResponse, TimeSpan.FromMinutes(30));
                
                var tokensUsed = (systemPrompt.Length + userMessage.Length + aiResponse.Length) / 4;
                return (aiResponse, tokensUsed);
            }
            catch (Grpc.Core.RpcException ex) when (ex.StatusCode == Grpc.Core.StatusCode.ResourceExhausted)
            {
                // Handle rate limiting (429 equivalent in gRPC)
                _cache.Set(COOLDOWN_KEY, true, TimeSpan.FromSeconds(60));
                
                if (retryCount < maxRetries)
                {
                    retryCount++;
                    _logger.LogWarning("Vertex AI Rate limited. Retrying {RetryCount}/{MaxRetries} after {Delay}ms...", retryCount, maxRetries, delayMs);
                    await Task.Delay(delayMs);
                    delayMs += 10000; // Increment backoff
                    continue;
                }

                _logger.LogError("Vertex AI Quota exhausted for MODEL: {Model}.", _model);
                return ("Hệ thống đang đạt giới hạn câu hỏi. Bạn vui lòng chờ 1 phút rồi hỏi tiếp nhé!", 0);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Vertex AI");
                if (retryCount >= maxRetries) 
                {
                    return ("Xin lỗi, có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.", 0);
                }
                
                retryCount++;
                await Task.Delay(2000);
            }
        }
    }
    
    private List<Content> BuildContents(string userMessage, List<ChatMessageDto>? history)
    {
        var contents = new List<Content>();
        
        // Add conversation history (only last 3 messages to save tokens)
        if (history != null && history.Any())
        {
            var recentHistory = history.TakeLast(3).ToList();
            foreach (var msg in recentHistory)
            {
                contents.Add(new Content
                {
                    Role = msg.Role == "user" ? "user" : "model",
                    Parts = { new Part { Text = msg.Content } }
                });
            }
        }
        
        // Add current user message
        contents.Add(new Content
        {
            Role = "user",
            Parts = { new Part { Text = userMessage } }
        });
        
        return contents;
    }
}

// DTO for chat messages (used internally)
public class ChatMessageDto
{
    public string Role { get; set; } = null!;
    public string Content { get; set; } = null!;
}
