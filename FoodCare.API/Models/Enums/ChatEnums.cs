namespace FoodCare.API.Models.Enums;

public enum MessageIntent
{
    Greeting,
    ProductSearch,
    OrderStatus,
    SubscriptionManagement,
    FAQ_Shipping,
    FAQ_Payment,
    FAQ_ReturnPolicy,
    MembershipInfo,
    CouponCheck,
    Complex // Needs AI reasoning
}

public enum MessageRole
{
    User,
    Assistant
}
