using FoodCare.API.Models.Enums;
using System.Text.RegularExpressions;

namespace FoodCare.API.Services.Implementations;

/// <summary>
/// Classifies user messages to determine intent (rule-based, no AI needed)
/// This saves API calls by handling simple cases without LLM
/// </summary>
public class MessageClassifier
{
    public MessageIntent ClassifyIntent(string message)
    {
        var lowerMessage = message.ToLower().Trim();
        
        // Greeting patterns
        if (IsMatch(lowerMessage, @"\b(xin chào|hi|hello|chào bạn|hey)\b"))
        {
            return MessageIntent.Greeting;
        }
        
        // Order status check patterns
        if (IsMatch(lowerMessage, @"\b(đơn hàng|order|đơn của tôi|tracking|kiểm tra đơn|đơn.*đâu)\b"))
        {
            return MessageIntent.OrderStatus;
        }
        
        // Product search patterns
        if (IsMatch(lowerMessage, @"\b(tìm|mua|cần|muốn|có|sản phẩm|hàng)\b"))
        {
            return MessageIntent.ProductSearch;
        }
        
        // Subscription management
        if (IsMatch(lowerMessage, @"\b(subscription|đăng ký|định kỳ|tạm dừng|pause|hủy|cancel)\b"))
        {
            return MessageIntent.SubscriptionManagement;
        }
        
        // FAQ: Shipping
        if (IsMatch(lowerMessage, @"\b(giao hàng|ship|vận chuyển|delivery|phí ship)\b"))
        {
            return MessageIntent.FAQ_Shipping;
        }
        
        // FAQ: Payment
        if (IsMatch(lowerMessage, @"\b(thanh toán|payment|momo|zalopay|cod|thẻ)\b"))
        {
            return MessageIntent.FAQ_Payment;
        }
        
        // FAQ: Return policy
        if (IsMatch(lowerMessage, @"\b(đổi|trả|hoàn|return|refund)\b"))
        {
            return MessageIntent.FAQ_ReturnPolicy;
        }
        
        // Membership info
        if (IsMatch(lowerMessage, @"\b(hạng|tier|thành viên|membership|điểm|point|nâng hạng)\b"))
        {
            return MessageIntent.MembershipInfo;
        }
        
        // Coupon check
        if (IsMatch(lowerMessage, @"\b(mã|coupon|voucher|giảm giá|discount)\b"))
        {
            return MessageIntent.CouponCheck;
        }
        
        // Default: needs AI reasoning
        return MessageIntent.Complex;
    }
    
    private bool IsMatch(string text, string pattern)
    {
        return Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase);
    }
}
