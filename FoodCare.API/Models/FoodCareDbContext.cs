using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums; // Đảm bảo namespace này đúng với nơi bạn lưu Enum

namespace FoodCare.API.Models;

public partial class FoodCareDbContext : DbContext
{
    public FoodCareDbContext()
    {
    }

    public FoodCareDbContext(DbContextOptions<FoodCareDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Address> Addresses { get; set; }
    public virtual DbSet<Category> Categories { get; set; }
    public virtual DbSet<Coupon> Coupons { get; set; }
    public virtual DbSet<CouponUsage> CouponUsages { get; set; }
    public virtual DbSet<InventoryLog> InventoryLogs { get; set; }
    public virtual DbSet<MemberTier> MemberTiers { get; set; }
    public virtual DbSet<Notification> Notifications { get; set; }
    public virtual DbSet<Order> Orders { get; set; }
    public virtual DbSet<OrderItem> OrderItems { get; set; }
    public virtual DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }
    public virtual DbSet<PaymentMethod> PaymentMethods { get; set; }
    public virtual DbSet<Product> Products { get; set; }
    public virtual DbSet<Review> Reviews { get; set; }
    public virtual DbSet<ReviewHelpful> ReviewHelpfuls { get; set; }
    public virtual DbSet<Subscription> Subscriptions { get; set; }
    public virtual DbSet<SubscriptionSchedule> SubscriptionSchedules { get; set; }
    public virtual DbSet<Supplier> Suppliers { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<ZaloMessagesLog> ZaloMessagesLogs { get; set; }
    public virtual DbSet<ZaloTemplate> ZaloTemplates { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseNpgsql("Name=ConnectionStrings:DefaultConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // =========================================================
        // 1. CẤU HÌNH ENUM CỦA DỰ ÁN (SỬA LẠI CHUẨN)
        // =========================================================
        // Sử dụng Generic <T> để EF Core hiểu map với Enum C#
        modelBuilder.HasPostgresEnum<UserRole>("user_role");
        modelBuilder.HasPostgresEnum<OrderStatus>("order_status");
        modelBuilder.HasPostgresEnum<PaymentStatus>("payment_status");
        modelBuilder.HasPostgresEnum<SubFrequency>("sub_frequency");
        modelBuilder.HasPostgresEnum<SubStatus>("sub_status");

        // =========================================================
        // 2. ENUM HỆ THỐNG SUPABASE (GIỮ NGUYÊN)
        // =========================================================
        modelBuilder
            .HasPostgresEnum("auth", "aal_level", new[] { "aal1", "aal2", "aal3" })
            .HasPostgresEnum("auth", "code_challenge_method", new[] { "s256", "plain" })
            .HasPostgresEnum("auth", "factor_status", new[] { "unverified", "verified" })
            .HasPostgresEnum("auth", "factor_type", new[] { "totp", "webauthn", "phone" })
            .HasPostgresEnum("auth", "oauth_authorization_status", new[] { "pending", "approved", "denied", "expired" })
            .HasPostgresEnum("auth", "oauth_client_type", new[] { "public", "confidential" })
            .HasPostgresEnum("auth", "oauth_registration_type", new[] { "dynamic", "manual" })
            .HasPostgresEnum("auth", "oauth_response_type", new[] { "code" })
            .HasPostgresEnum("auth", "one_time_token_type", new[] { "confirmation_token", "reauthentication_token", "recovery_token", "email_change_token_new", "email_change_token_current", "phone_change_token" })
            .HasPostgresEnum("realtime", "action", new[] { "INSERT", "UPDATE", "DELETE", "TRUNCATE", "ERROR" })
            .HasPostgresEnum("realtime", "equality_op", new[] { "eq", "neq", "lt", "lte", "gt", "gte", "in" })
            .HasPostgresEnum("storage", "buckettype", new[] { "STANDARD", "ANALYTICS", "VECTOR" })
            .HasPostgresExtension("extensions", "pg_stat_statements")
            .HasPostgresExtension("extensions", "pgcrypto")
            .HasPostgresExtension("extensions", "uuid-ossp")
            .HasPostgresExtension("graphql", "pg_graphql")
            .HasPostgresExtension("pg_trgm")
            .HasPostgresExtension("vault", "supabase_vault");

        // =========================================================
        // 3. CẤU HÌNH BẢNG (ENTITY CONFIGURATION)
        // =========================================================

        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("addresses_pkey");
            entity.ToTable("addresses");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.AddressLine1).HasColumnName("address_line1");
            entity.Property(e => e.AddressLine2).HasColumnName("address_line2");
            entity.Property(e => e.City).HasMaxLength(100).HasColumnName("city");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.District).HasMaxLength(100).HasColumnName("district");
            entity.Property(e => e.IsDefault).HasDefaultValue(false).HasColumnName("is_default");
            entity.Property(e => e.PhoneNumber).HasMaxLength(20).HasColumnName("phone_number");
            entity.Property(e => e.RecipientName).HasMaxLength(100).HasColumnName("recipient_name");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Ward).HasMaxLength(100).HasColumnName("ward");

            entity.HasOne(d => d.User).WithMany(p => p.Addresses)
                .HasForeignKey(d => d.UserId).HasConstraintName("addresses_user_id_fkey");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("categories_pkey");
            entity.ToTable("categories");
            entity.HasIndex(e => e.Slug, "categories_slug_key").IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.ParentId).HasColumnName("parent_id");
            entity.Property(e => e.Slug).HasMaxLength(150).HasColumnName("slug");

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId).HasConstraintName("categories_parent_id_fkey");
        });

        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("coupons_pkey");
            entity.ToTable("coupons");
            entity.HasIndex(e => e.Code, "coupons_code_key").IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code).HasMaxLength(50).HasColumnName("code");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.DiscountType).HasMaxLength(20).HasColumnName("discount_type");
            entity.Property(e => e.DiscountValue).HasPrecision(15, 2).HasColumnName("discount_value");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.MaxDiscountAmount).HasPrecision(15, 2).HasColumnName("max_discount_amount");
            entity.Property(e => e.MinOrderValue).HasPrecision(15, 2).HasDefaultValueSql("0").HasColumnName("min_order_value");
            entity.Property(e => e.StartDate).HasDefaultValueSql("now()").HasColumnName("start_date");
            entity.Property(e => e.UsageCount).HasDefaultValue(0).HasColumnName("usage_count");
            entity.Property(e => e.UsageLimit).HasColumnName("usage_limit");
        });

        modelBuilder.Entity<CouponUsage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("coupon_usage_pkey");
            entity.ToTable("coupon_usage");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CouponId).HasColumnName("coupon_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Coupon).WithMany(p => p.CouponUsages).HasForeignKey(d => d.CouponId).HasConstraintName("coupon_usage_coupon_id_fkey");
            entity.HasOne(d => d.Order).WithMany(p => p.CouponUsages).HasForeignKey(d => d.OrderId).HasConstraintName("coupon_usage_order_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.CouponUsages).HasForeignKey(d => d.UserId).HasConstraintName("coupon_usage_user_id_fkey");
        });

        modelBuilder.Entity<InventoryLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("inventory_logs_pkey");
            entity.ToTable("inventory_logs");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.ChangeAmount).HasColumnName("change_amount");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.CurrentStock).HasColumnName("current_stock");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Reason).HasMaxLength(100).HasColumnName("reason");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.InventoryLogs).HasForeignKey(d => d.CreatedBy).HasConstraintName("inventory_logs_created_by_fkey");
            entity.HasOne(d => d.Product).WithMany(p => p.InventoryLogs).HasForeignKey(d => d.ProductId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("inventory_logs_product_id_fkey");
        });

        modelBuilder.Entity<MemberTier>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("member_tiers_pkey");
            entity.ToTable("member_tiers");
            entity.HasIndex(e => e.Name, "member_tiers_name_key").IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.DiscountPercent).HasPrecision(5, 2).HasDefaultValueSql("0").HasColumnName("discount_percent");
            entity.Property(e => e.MinPoint).HasDefaultValue(0).HasColumnName("min_point");
            entity.Property(e => e.Name).HasMaxLength(50).HasColumnName("name");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("notifications_pkey");
            entity.ToTable("notifications");
            entity.HasIndex(e => e.UserId, "idx_notif_user_unread").HasFilter("(is_read = false)");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.IsRead).HasDefaultValue(false).HasColumnName("is_read");
            entity.Property(e => e.LinkUrl).HasColumnName("link_url");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.Title).HasMaxLength(255).HasColumnName("title");
            entity.Property(e => e.Type).HasMaxLength(50).HasColumnName("type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("notifications_user_id_fkey");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("orders_pkey");
            entity.ToTable("orders");
            entity.HasIndex(e => e.CreatedAt, "idx_orders_created_at").IsDescending();
            entity.HasIndex(e => e.UserId, "idx_orders_user");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.DiscountAmount).HasPrecision(15, 2).HasDefaultValueSql("0").HasColumnName("discount_amount");
            entity.Property(e => e.IsSubscriptionOrder).HasDefaultValue(false).HasColumnName("is_subscription_order");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.PaymentMethodSnapshot).HasColumnType("jsonb").HasColumnName("payment_method_snapshot");
            entity.Property(e => e.ShippingAddressSnapshot).HasColumnType("jsonb").HasColumnName("shipping_address_snapshot");
            entity.Property(e => e.ShippingFee).HasPrecision(15, 2).HasDefaultValueSql("0").HasColumnName("shipping_fee");
            entity.Property(e => e.ShippingProvider).HasMaxLength(50).HasColumnName("shipping_provider");
            entity.Property(e => e.SubscriptionId).HasColumnName("subscription_id");
            entity.Property(e => e.Subtotal).HasPrecision(15, 2).HasColumnName("subtotal");
            entity.Property(e => e.TotalAmount).HasPrecision(15, 2).HasColumnName("total_amount");
            entity.Property(e => e.TrackingNumber).HasMaxLength(100).HasColumnName("tracking_number");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            
            // --- FIX 2: Cấu hình ColumnType cho Enum Order ---
            entity.Property(e => e.Status)
                  .HasDefaultValue(OrderStatus.pending)
                  .HasColumnName("status")
                  .HasConversion(
                      v => v.ToString().ToLower(),
                      v => (OrderStatus)Enum.Parse(typeof(OrderStatus), v, true)
                  );

            entity.Property(e => e.PaymentStatus)
                  .HasDefaultValue(PaymentStatus.unpaid)
                  .HasColumnName("payment_status")
                  .HasConversion(
                      v => v.ToString().ToLower(),
                      v => (PaymentStatus)Enum.Parse(typeof(PaymentStatus), v, true)
                  );

            entity.HasOne(d => d.Subscription).WithMany(p => p.Orders).HasForeignKey(d => d.SubscriptionId).HasConstraintName("orders_subscription_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.Orders).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.SetNull).HasConstraintName("orders_user_id_fkey");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("order_items_pkey");
            entity.ToTable("order_items");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.Price).HasPrecision(15, 2).HasColumnName("price");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.ProductName).HasMaxLength(255).HasColumnName("product_name");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.TotalPrice).HasPrecision(15, 2).HasComputedColumnSql("((quantity)::numeric * price)", true).HasColumnName("total_price");
            entity.Property(e => e.VariantSnapshot).HasColumnType("jsonb").HasColumnName("variant_snapshot");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems).HasForeignKey(d => d.OrderId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("order_items_order_id_fkey");
            entity.HasOne(d => d.Product).WithMany(p => p.OrderItems).HasForeignKey(d => d.ProductId).OnDelete(DeleteBehavior.SetNull).HasConstraintName("order_items_product_id_fkey");
        });

        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("order_status_history_pkey");
            entity.ToTable("order_status_history");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            
            // --- FIX 3: Cấu hình ColumnType cho Enum History ---
            entity.Property(e => e.PreviousStatus)
                  .HasColumnName("previous_status")
                  .HasConversion(
                      v => v.ToString().ToLower(),
                      v => (OrderStatus)Enum.Parse(typeof(OrderStatus), v, true)
                  );
            
            entity.Property(e => e.NewStatus)
                  .HasColumnName("new_status")
                  .HasConversion(
                      v => v.ToString().ToLower(),
                      v => (OrderStatus)Enum.Parse(typeof(OrderStatus), v, true)
                  );

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.OrderStatusHistories).HasForeignKey(d => d.CreatedBy).HasConstraintName("order_status_history_created_by_fkey");
            entity.HasOne(d => d.Order).WithMany(p => p.OrderStatusHistories).HasForeignKey(d => d.OrderId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("order_status_history_order_id_fkey");
        });

        modelBuilder.Entity<PaymentMethod>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("payment_methods_pkey");
            entity.ToTable("payment_methods");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.ExpiryDate).HasColumnName("expiry_date");
            entity.Property(e => e.IsDefault).HasDefaultValue(false).HasColumnName("is_default");
            entity.Property(e => e.Last4Digits).HasMaxLength(4).HasColumnName("last4_digits");
            entity.Property(e => e.Provider).HasMaxLength(50).HasColumnName("provider");
            entity.Property(e => e.ProviderToken).HasColumnName("provider_token");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.PaymentMethods).HasForeignKey(d => d.UserId).HasConstraintName("payment_methods_user_id_fkey");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("products_pkey");
            entity.ToTable("products");
            entity.HasIndex(e => e.CategoryId, "idx_products_category");
            entity.HasIndex(e => e.BasePrice, "idx_products_price");
            entity.HasIndex(e => e.SearchVector, "idx_products_search").HasMethod("gin");
            entity.HasIndex(e => e.Slug, "idx_products_slug");
            entity.HasIndex(e => e.Sku, "products_sku_key").IsUnique();
            entity.HasIndex(e => e.Slug, "products_slug_key").IsUnique();
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.BasePrice).HasPrecision(15, 2).HasColumnName("base_price");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CostPrice).HasPrecision(15, 2).HasColumnName("cost_price");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Images).HasDefaultValueSql("'[]'::jsonb").HasColumnType("jsonb").HasColumnName("images");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false).HasColumnName("is_deleted");
            entity.Property(e => e.IsSubscriptionAvailable).HasDefaultValue(false).HasColumnName("is_subscription_available");
            entity.Property(e => e.LowStockThreshold).HasDefaultValue(10).HasColumnName("low_stock_threshold");
            entity.Property(e => e.MetaDescription).HasColumnName("meta_description");
            entity.Property(e => e.MetaTitle).HasMaxLength(255).HasColumnName("meta_title");
            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("name");
            entity.Property(e => e.OriginalPrice).HasPrecision(15, 2).HasColumnName("original_price");
            entity.Property(e => e.RatingAverage).HasPrecision(3, 2).HasDefaultValueSql("0").HasColumnName("rating_average");
            entity.Property(e => e.RatingCount).HasDefaultValue(0).HasColumnName("rating_count");
            entity.Property(e => e.SearchVector).HasColumnName("search_vector");
            entity.Property(e => e.Sku).HasMaxLength(50).HasColumnName("sku");
            entity.Property(e => e.Slug).HasMaxLength(255).HasColumnName("slug");
            entity.Property(e => e.StockQuantity).HasDefaultValue(0).HasColumnName("stock_quantity");
            entity.Property(e => e.SubscriptionDiscounts).HasColumnType("jsonb").HasColumnName("subscription_discounts");
            entity.Property(e => e.SupplierId).HasColumnName("supplier_id");
            entity.Property(e => e.Tags).HasColumnName("tags");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnName("updated_at");

            entity.HasOne(d => d.Category).WithMany(p => p.Products).HasForeignKey(d => d.CategoryId).HasConstraintName("products_category_id_fkey");
            entity.HasOne(d => d.Supplier).WithMany(p => p.Products).HasForeignKey(d => d.SupplierId).HasConstraintName("products_supplier_id_fkey");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("reviews_pkey");
            entity.ToTable("reviews");
            entity.HasIndex(e => new { e.UserId, e.OrderId, e.ProductId }, "reviews_user_id_order_id_product_id_key").IsUnique();
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.Images).HasColumnType("jsonb").HasColumnName("images");
            entity.Property(e => e.IsHidden).HasDefaultValue(false).HasColumnName("is_hidden");
            entity.Property(e => e.IsVerifiedPurchase).HasDefaultValue(true).HasColumnName("is_verified_purchase");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.ReplyAt).HasColumnName("reply_at");
            entity.Property(e => e.ReplyComment).HasColumnName("reply_comment");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Order).WithMany(p => p.Reviews).HasForeignKey(d => d.OrderId).HasConstraintName("reviews_order_id_fkey");
            entity.HasOne(d => d.Product).WithMany(p => p.Reviews).HasForeignKey(d => d.ProductId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("reviews_product_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.Reviews).HasForeignKey(d => d.UserId).HasConstraintName("reviews_user_id_fkey");
        });

        modelBuilder.Entity<ReviewHelpful>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("review_helpful_pkey");
            entity.ToTable("review_helpful");
            entity.HasIndex(e => new { e.ReviewId, e.UserId }, "review_helpful_review_id_user_id_key").IsUnique();
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.ReviewId).HasColumnName("review_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Review).WithMany(p => p.ReviewHelpfuls).HasForeignKey(d => d.ReviewId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("review_helpful_review_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.ReviewHelpfuls).HasForeignKey(d => d.UserId).HasConstraintName("review_helpful_user_id_fkey");
        });

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("subscriptions_pkey");
            entity.ToTable("subscriptions");
            entity.HasIndex(e => e.NextDeliveryDate, "idx_subs_next_delivery").HasFilter("(status = 'active'::sub_status)");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.DiscountPercent).HasPrecision(5, 2).HasDefaultValueSql("0").HasColumnName("discount_percent");
            entity.Property(e => e.NextDeliveryDate).HasColumnName("next_delivery_date");
            entity.Property(e => e.PauseUntil).HasColumnName("pause_until");
            entity.Property(e => e.PaymentMethodId).HasColumnName("payment_method_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Quantity).HasDefaultValue(1).HasColumnName("quantity");
            entity.Property(e => e.ShippingAddressId).HasColumnName("shipping_address_id");
            entity.Property(e => e.StartDate).HasDefaultValueSql("CURRENT_DATE").HasColumnName("start_date");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            
            // --- FIX 4: Cấu hình ColumnType cho Enum Subscription ---
            entity.Property(e => e.Frequency)
                  .HasColumnName("frequency")
                  .HasConversion(
                      v => v.ToString().ToLower(),
                      v => (SubFrequency)Enum.Parse(typeof(SubFrequency), v, true)
                  );

            entity.Property(e => e.Status)
                  .HasDefaultValue(SubStatus.active)
                  .HasColumnName("status")
                  .HasConversion(
                      v => v.ToString().ToLower(),
                      v => (SubStatus)Enum.Parse(typeof(SubStatus), v, true)
                  );

            entity.HasOne(d => d.PaymentMethod).WithMany(p => p.Subscriptions).HasForeignKey(d => d.PaymentMethodId).HasConstraintName("subscriptions_payment_method_id_fkey");
            entity.HasOne(d => d.Product).WithMany(p => p.Subscriptions).HasForeignKey(d => d.ProductId).HasConstraintName("subscriptions_product_id_fkey");
            entity.HasOne(d => d.ShippingAddress).WithMany(p => p.Subscriptions).HasForeignKey(d => d.ShippingAddressId).HasConstraintName("subscriptions_shipping_address_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.Subscriptions).HasForeignKey(d => d.UserId).HasConstraintName("subscriptions_user_id_fkey");
        });

        modelBuilder.Entity<SubscriptionSchedule>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("subscription_schedules_pkey");
            entity.ToTable("subscription_schedules");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.IsProcessed).HasDefaultValue(false).HasColumnName("is_processed");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.ScheduledDate).HasColumnName("scheduled_date");
            entity.Property(e => e.SubscriptionId).HasColumnName("subscription_id");

            entity.HasOne(d => d.Order).WithMany(p => p.SubscriptionSchedules).HasForeignKey(d => d.OrderId).HasConstraintName("subscription_schedules_order_id_fkey");
            entity.HasOne(d => d.Subscription).WithMany(p => p.SubscriptionSchedules).HasForeignKey(d => d.SubscriptionId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("subscription_schedules_subscription_id_fkey");
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("suppliers_pkey");
            entity.ToTable("suppliers");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.ContactEmail).HasMaxLength(100).HasColumnName("contact_email");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.Name).HasMaxLength(150).HasColumnName("name");
            entity.Property(e => e.Phone).HasMaxLength(20).HasColumnName("phone");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");
            entity.ToTable("users");
            entity.HasIndex(e => e.Email, "idx_users_email");
            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();
            entity.Property(e => e.Id).ValueGeneratedNever().HasColumnName("id");
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.Email).HasMaxLength(255).HasColumnName("email");
            entity.Property(e => e.FullName).HasMaxLength(100).HasColumnName("full_name");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.LoyaltyPoints).HasDefaultValue(0).HasColumnName("loyalty_points");
            entity.Property(e => e.PhoneNumber).HasMaxLength(20).HasColumnName("phone_number");
            
            // --- FIX 1: Cấu hình ColumnType cho Enum User (NGUYÊN NHÂN LỖI CHÍNH) ---
            entity.Property(e => e.Role)
                .HasColumnName("role")
                .HasConversion(
                    v => v.ToString().ToLower(), // Convert enum to lowercase string (customer, admin, staff)
                    v => (UserRole)Enum.Parse(typeof(UserRole), v, true) // Convert string back to enum
                );

            entity.Property(e => e.TierId).HasDefaultValue(1).HasColumnName("tier_id");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnName("updated_at");

            entity.HasOne(d => d.Tier).WithMany(p => p.Users).HasForeignKey(d => d.TierId).HasConstraintName("users_tier_id_fkey");
        });

        modelBuilder.Entity<ZaloMessagesLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("zalo_messages_log_pkey");
            entity.ToTable("zalo_messages_log");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.ErrorMessage).HasColumnName("error_message");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.PhoneSent).HasMaxLength(20).HasColumnName("phone_sent");
            entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("status");
            entity.Property(e => e.TemplateId).HasColumnName("template_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.ZaloMsgId).HasMaxLength(100).HasColumnName("zalo_msg_id");

            entity.HasOne(d => d.Order).WithMany(p => p.ZaloMessagesLogs).HasForeignKey(d => d.OrderId).HasConstraintName("zalo_messages_log_order_id_fkey");
            entity.HasOne(d => d.Template).WithMany(p => p.ZaloMessagesLogs).HasForeignKey(d => d.TemplateId).HasConstraintName("zalo_messages_log_template_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.ZaloMessagesLogs).HasForeignKey(d => d.UserId).HasConstraintName("zalo_messages_log_user_id_fkey");
        });

        modelBuilder.Entity<ZaloTemplate>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("zalo_templates_pkey");
            entity.ToTable("zalo_templates");
            entity.HasIndex(e => e.TemplateId, "zalo_templates_template_id_key").IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ContentSample).HasColumnName("content_sample");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.Price).HasPrecision(10, 2).HasDefaultValue(200m).HasColumnName("price");
            entity.Property(e => e.TemplateId).HasMaxLength(50).HasColumnName("template_id");
            entity.Property(e => e.TemplateName).HasMaxLength(100).HasColumnName("template_name");
        });
    }
}