-- ============================================================================
-- SUBSCRIPTION REMINDER SYSTEM - DATABASE MIGRATION
-- Thêm bảng subscription_confirmations để track email confirmations
-- ============================================================================

-- TABLE: Subscription Confirmations (Xác nhận đơn định kỳ)
CREATE TABLE public.subscription_confirmations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    scheduled_delivery_date DATE NOT NULL,
    is_confirmed BOOLEAN DEFAULT FALSE,
    customer_response VARCHAR(50) CHECK (customer_response IN ('continue', 'pause', 'cancel')),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes để tăng tốc query
CREATE INDEX idx_subscription_confirmations_token 
    ON public.subscription_confirmations(token);
    
CREATE INDEX idx_subscription_confirmations_subscription_id 
    ON public.subscription_confirmations(subscription_id);
    
CREATE INDEX idx_subscription_confirmations_expires_at 
    ON public.subscription_confirmations(expires_at) 
    WHERE is_confirmed = FALSE;

-- Comment để document
COMMENT ON TABLE public.subscription_confirmations IS 'Lưu trữ các yêu cầu xác nhận đơn hàng định kỳ được gửi qua email';
COMMENT ON COLUMN public.subscription_confirmations.token IS 'Token unique để xác thực link trong email';
COMMENT ON COLUMN public.subscription_confirmations.customer_response IS 'Phản hồi của khách: continue, pause, hoặc cancel';

-- Verify migration
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_confirmations'
ORDER BY ordinal_position;
