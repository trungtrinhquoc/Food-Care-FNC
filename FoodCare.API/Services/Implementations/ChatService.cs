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
    private readonly IOpenRouterService _openRouter;
    private readonly IOrderService _orderService;
    private readonly IProductService _productService;
    private readonly MessageClassifier _classifier;
    private readonly string _appUrl;


    public ChatService(
        FoodCareDbContext context,
        FaqCacheService faqCache,
        IOpenRouterService openRouter,
        IOrderService orderService,
        IProductService productService,
        MessageClassifier classifier,
        IConfiguration configuration)
    {
        _context = context;
        _faqCache = faqCache;
        _openRouter = openRouter;
        _orderService = orderService;
        _productService = productService;
        _classifier = classifier;
        _appUrl = configuration["AppUrl"] ?? "http://localhost:5173";
    }

    public async Task<string> AskQuestionAsync(string question, Guid userId)
    {
        // 1. Check greetings or simple intents first (free!)
        var intent = _classifier.ClassifyIntent(question);
        if (intent == MessageIntent.Greeting)
        {
            return "👋 Xin chào! Tôi là trợ lý AI của Food & Care. Tôi có thể giúp bạn tìm sản phẩm, kiểm tra đơn hàng, hoặc tư vấn về các dịch vụ. Bạn cần gì hôm nay?";
        }

        if (intent == MessageIntent.Farewell)
        {
            return "😊 Rất vui được hỗ trợ bạn! Chúc bạn một ngày tốt lành và hẹn gặp lại tại Food & Care nhé.";
        }

        // 2. Check FAQ cache first (to save API costs)
        var faqAnswer = await _faqCache.FindAnswerAsync(question);

        if (faqAnswer != null)
        {
            return faqAnswer;
        }

        // 3. No FAQ found → Prepare context for AI
        var user = await _context.Users
            .Include(u => u.Tier)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null)
        {
            return "Xin lỗi, không tìm thấy thông tin người dùng.";
        }

        // Fetch recent orders only if needed
        var ordersSummary = "Không có thông tin đơn hàng cụ thể trong yêu cầu này.";
        if (intent == MessageIntent.OrderStatus || intent == MessageIntent.Complex)
        {
            var recentOrders = await _orderService.GetOrdersByUserIdAsync(userId);
            if (recentOrders != null && recentOrders.Any())
            {
                var summaries = recentOrders.Take(3).Select(o => 
                    $"- Đơn hàng #{o.Id.ToString().Substring(0,8).ToUpper()}: Trạng thái {o.Status}, Tổng tiền {o.TotalAmount:N0}đ, Ngày đặt {o.CreatedAt?.ToLocalTime().ToString("dd/MM/yyyy") ?? "N/A"}. {(string.IsNullOrEmpty(o.TrackingNumber) ? "" : $"Mã vận đơn: {o.TrackingNumber}")}");
                ordersSummary = string.Join("\n", summaries);
            }
            else
            {
                ordersSummary = "Bạn chưa có đơn hàng nào gần đây.";
            }
        }

        // Fetch active products only if needed
        var productsList = "Không có thông tin sản phẩm cụ thể trong yêu cầu này.";
        if (intent == MessageIntent.ProductSearch || intent == MessageIntent.Complex)
        {
            var (products, _) = await _productService.GetProductsAsync(new Models.DTOs.Products.ProductFilterDto { PageSize = 20 }); // Reduced to 20 for speed
            if (products != null && products.Any())
            {
                var productInfo = products.Select(p => $"- {p.Name} (Slug: {p.Slug}, Giá: {p.BasePrice:N0}đ)");
                productsList = string.Join("\n", productInfo);
            }
        }

        // Build personalized system prompt
        var systemPrompt = $@"Bạn là trợ lý AI chuyên nghiệp của Food & Care - hệ thống cung cấp thực phẩm sạch và dịch vụ subscription.
Khách hàng: {user.FullName ?? "Khách"}
Hạng thành viên: {user.Tier?.Name ?? "Bronze"}
Điểm tích lũy: {user.LoyaltyPoints ?? 0}

Thông tin đơn hàng gần đây:
{ordersSummary}

Danh mục sản phẩm hiện có:
{productsList}

Nhiệm vụ: Tư vấn sản phẩm, hỗ trợ đơn hàng, giải thích về Subscription và Membership Tier.
Quy tắc sản phẩm: Nếu khách hỏi về sản phẩm, hãy cung cấp link: [Tên sản phẩm]({_appUrl}/product/{{slug}}).
Quy tắc đơn hàng: Tóm tắt trạng thái từ danh sách trên.
Phong cách: Thân thiện, ngắn gọn, chuyên nghiệp. Trả lời bằng tiếng Việt.";

        // Call OpenRouter AI (stateless)
        var (aiResponse, _) = await _openRouter.GenerateResponseAsync(
            systemPrompt,
            question,
            null // No history - stateless
        );

        return aiResponse;
    }
}

