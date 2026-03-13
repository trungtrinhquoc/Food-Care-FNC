using Microsoft.EntityFrameworkCore;
using Npgsql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FoodCare.API.Models.Enums;
using FoodCare.API.Helpers;
using FoodCare.API.Services.Interfaces;
using FoodCare.API.Services.Implementations;
using FoodCare.API.Services.Interfaces.Admin;
using FoodCare.API.Services.Implementations.Admin;
using FoodCare.API.Services.Interfaces.SupplierModule;
using FoodCare.API.Services.Implementations.SupplierModule;
using FoodCare.API.Services.Interfaces.StaffModule;
using FoodCare.API.Services.Implementations.StaffModule;
using System.Text.Json.Serialization;
using FoodCare.API.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddMemoryCache();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.CustomSchemaIds(type => type.FullName);
});

// Configure Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);

dataSourceBuilder.MapEnum<UserRole>("user_role");
dataSourceBuilder.MapEnum<OrderStatus>("order_status");
dataSourceBuilder.MapEnum<PaymentStatus>("payment_status");
dataSourceBuilder.MapEnum<SubFrequency>("sub_frequency");
dataSourceBuilder.MapEnum<SubStatus>("sub_status");

// Staff Module Enums
dataSourceBuilder.MapEnum<ShipmentStatus>("shipment_status");
dataSourceBuilder.MapEnum<ReceiptStatus>("receipt_status");
dataSourceBuilder.MapEnum<MovementType>("movement_type");
dataSourceBuilder.MapEnum<DiscrepancyType>("discrepancy_type");
dataSourceBuilder.MapEnum<InventoryType>("inventory_type");

// Inbound Session Enums
dataSourceBuilder.MapEnum<InboundSessionStatus>("inbound_session_status");
dataSourceBuilder.MapEnum<InboundReceiptStatus>("inbound_receipt_status");

dataSourceBuilder.EnableDynamicJson();

var dataSource = dataSourceBuilder.Build();
builder.Services.AddSingleton(dataSource);

builder.Services.AddDbContext<FoodCareDbContext>(options =>
    options.UseNpgsql(dataSource));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured")))
    };
});

// Configure CORS - Allow all origins in development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow any origin in development
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Configure Supabase Client
var supabaseUrl = builder.Configuration["Supabase:Url"] ?? throw new InvalidOperationException("Supabase URL not configured");
var supabaseKey = builder.Configuration["Supabase:Key"] ?? throw new InvalidOperationException("Supabase Key not configured");
var supabaseOptions = new Supabase.SupabaseOptions
{
    AutoConnectRealtime = false // Disable realtime to avoid async initialization issues
};
builder.Services.AddScoped<Supabase.Client>(_ => new Supabase.Client(supabaseUrl, supabaseKey, supabaseOptions));

// Register HttpClient for API calls
builder.Services.AddHttpClient();

// Register Helpers
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddHttpContextAccessor();

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<ISubscriptionReminderService, SubscriptionReminderService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IOrderService, OrderService>();

// Register Admin Services
builder.Services.AddScoped<IAdminStatsService, AdminStatsService>();
builder.Services.AddScoped<IAdminProductService, AdminProductService>();
builder.Services.AddScoped<IAdminOrderService, AdminOrderService>();
builder.Services.AddScoped<IAdminCustomerService, AdminCustomerService>();
builder.Services.AddScoped<IAdminSupplierService, AdminSupplierService>();
builder.Services.AddScoped<IAdminZaloService, AdminZaloService>();
builder.Services.AddScoped<IAdminCategoryService, AdminCategoryService>();
builder.Services.AddScoped<IAdminReviewService, AdminReviewService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IAdminSubscriptionService, AdminSubscriptionService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IPayOsService,PayOsService >();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddScoped<ICouponService, CouponService>();

// Register Chat Services (Simplified - Stateless)
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddSingleton<MessageClassifier>(); // Singleton - no state
builder.Services.AddScoped<FaqCacheService>();
builder.Services.AddScoped<IOpenRouterService, OpenRouterService>();



// Register Supplier Services
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<ISupplierAuthService, SupplierAuthService>();

// Register Geocoding Service (Nominatim/OpenStreetMap)
builder.Services.AddHttpClient<FoodCare.API.Services.Implementations.NominatimGeocodingService>();
builder.Services.AddScoped<FoodCare.API.Services.Interfaces.IGeocodingService, FoodCare.API.Services.Implementations.NominatimGeocodingService>();

// Register Staff Module Services
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddScoped<IStaffMemberService, StaffMemberService>();
builder.Services.AddScoped<IShipmentService, ShipmentService>();
builder.Services.AddScoped<IReceiptService, ReceiptService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IDiscrepancyService, DiscrepancyService>();
builder.Services.AddScoped<IReturnService, ReturnService>();
builder.Services.AddScoped<IInboundSessionService, InboundSessionService>();
builder.Services.AddScoped<ISupplierInboundService, SupplierInboundService>();

// Background service: auto-close expired inbound sessions
builder.Services.AddHostedService<FoodCare.API.Services.Background.InboundSessionExpiryService>();

// Register Shipping Flow Service (Supplier → Staff → User)
builder.Services.AddScoped<IShippingFlowService, ShippingFlowService>();

var app = builder.Build();

// === AUTO-CREATE MISSING TABLES ===
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FoodCareDbContext>();
    try
    {
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            CREATE TABLE IF NOT EXISTS coupons (
                id              SERIAL PRIMARY KEY,
                code            VARCHAR(50) NOT NULL UNIQUE,
                discount_type   VARCHAR(20),
                discount_value  NUMERIC(15,2) NOT NULL DEFAULT 0,
                min_order_value NUMERIC(15,2) DEFAULT 0,
                max_discount_amount NUMERIC(15,2),
                start_date      TIMESTAMPTZ DEFAULT now(),
                end_date        TIMESTAMPTZ,
                usage_limit     INT,
                usage_count     INT DEFAULT 0,
                is_active       BOOLEAN DEFAULT TRUE,
                created_at      TIMESTAMPTZ DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS coupon_usage (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                coupon_id   INT REFERENCES coupons(id) ON DELETE SET NULL,
                user_id     UUID NOT NULL,
                order_id    UUID,
                created_at  TIMESTAMPTZ DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                order_id                UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                subscription_id         UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
                user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider                VARCHAR(50) NOT NULL,
                transaction_type        VARCHAR(30) NOT NULL,
                amount                  NUMERIC(15,2) NOT NULL,
                currency                VARCHAR(10) DEFAULT 'VND',
                status                  VARCHAR(30) NOT NULL,
                attempt_number          INT NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
                provider_transaction_id VARCHAR(100),
                provider_response       JSONB,
                paid_at                 TIMESTAMPTZ,
                created_at              TIMESTAMPTZ DEFAULT now()
            );

            CREATE INDEX IF NOT EXISTS idx_transactions_order_id   ON transactions(order_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id    ON transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
        ";
        await cmd.ExecuteNonQueryAsync();
        await conn.CloseAsync();
        Console.WriteLine("✅ Tables coupons/coupon_usage/transactions ensured.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️  Table check failed: {ex.Message}");
    }
}
// ========================================

// Configure the HTTP request pipeline
// Enable Swagger for all environments (including production for debugging)
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
