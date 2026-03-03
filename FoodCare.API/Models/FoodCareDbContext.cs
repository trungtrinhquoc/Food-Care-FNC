using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.Suppliers;
using FoodCare.API.Models.Staff;

namespace FoodCare.API.Models;

public partial class FoodCareDbContext : DbContext {
    public FoodCareDbContext() {
    }

    public FoodCareDbContext(DbContextOptions<FoodCareDbContext> options)
        : base(options) {
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
    public virtual DbSet<OtpVerification> OtpVerifications { get; set; }
    public virtual DbSet<PaymentMethod> PaymentMethods { get; set; }
    public virtual DbSet<Product> Products { get; set; }
    public virtual DbSet<Review> Reviews { get; set; }
    public virtual DbSet<ReviewHelpful> ReviewHelpfuls { get; set; }
    public virtual DbSet<Subscription> Subscriptions { get; set; }
    public virtual DbSet<SubscriptionSchedule> SubscriptionSchedules { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<SupplierProduct> SupplierProducts { get; set; }
    public DbSet<SupplierOrder> SupplierOrders { get; set; }
    public DbSet<SupplierStats> SupplierStats { get; set; }
    public DbSet<SupplierAlert> SupplierAlerts { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<ZaloMessagesLog> ZaloMessagesLogs { get; set; }
    public virtual DbSet<ZaloTemplate> ZaloTemplates { get; set; }
    public virtual DbSet<Transaction> Transaction { get; set; }


    public DbSet<LoginLog> LoginLogs { get; set; }
    public DbSet<PointsHistory> PointsHistories { get; set; }
    public DbSet<PaymentLog> PaymentLogs { get; set; }

    // Staff Module DbSets
    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<StaffMember> StaffMembers { get; set; }
    public DbSet<StaffWarehouse> StaffWarehouses { get; set; }
    public DbSet<SupplierShipment> SupplierShipments { get; set; }
    public DbSet<ShipmentItem> ShipmentItems { get; set; }
    public DbSet<ShipmentDocument> ShipmentDocuments { get; set; }
    public DbSet<ShipmentStatusHistory> ShipmentStatusHistories { get; set; }
    public DbSet<Receipt> Receipts { get; set; }
    public DbSet<ReceiptItem> ReceiptItems { get; set; }
    public DbSet<WarehouseInventory> WarehouseInventories { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }
    public DbSet<StockReservation> StockReservations { get; set; }
    public DbSet<DiscrepancyReport> DiscrepancyReports { get; set; }
    public DbSet<DiscrepancyItem> DiscrepancyItems { get; set; }
    public DbSet<ReturnShipment> ReturnShipments { get; set; }
    public DbSet<ReturnItem> ReturnItems { get; set; }
    public DbSet<ChatFaq> ChatFaqs { get; set; }
    public DbSet<SubscriptionConfirmation> SubscriptionConfirmations { get; set; }

    // Inbound Session Module DbSets (Phiên nhập kho)
    public DbSet<InboundSession> InboundSessions { get; set; }
    public DbSet<InboundReceipt> InboundReceipts { get; set; }
    public DbSet<InboundReceiptDetail> InboundReceiptDetails { get; set; }
    public DbSet<InboundSessionSupplier> InboundSessionSuppliers { get; set; }

    // protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    //     => optionsBuilder.UseNpgsql("Name=ConnectionStrings:DefaultConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        // =========================================================
        // 1. CẤU HÌNH ENUM CỦA DỰ ÁN (SỬA LẠI CHUẨN)
        // =========================================================
        // Sử dụng Generic <T> để EF Core hiểu map với Enum C#
        modelBuilder.HasPostgresEnum<UserRole>("public", "user_role");
        modelBuilder.HasPostgresEnum<OrderStatus>("public", "order_status");
        modelBuilder.HasPostgresEnum<PaymentStatus>("public", "payment_status");
        modelBuilder.HasPostgresEnum<SubFrequency>("public", "sub_frequency");
        modelBuilder.HasPostgresEnum<SubStatus>("public", "sub_status");

        // Staff Module Enums
        modelBuilder.HasPostgresEnum<ShipmentStatus>("public", "shipment_status");
        modelBuilder.HasPostgresEnum<ReceiptStatus>("public", "receipt_status");
        modelBuilder.HasPostgresEnum<MovementType>("public", "movement_type");
        modelBuilder.HasPostgresEnum<DiscrepancyType>("public", "discrepancy_type");
        modelBuilder.HasPostgresEnum<InventoryType>("public", "inventory_type");

        // Inbound Session Enums
        modelBuilder.HasPostgresEnum<InboundSessionStatus>("public", "inbound_session_status");
        modelBuilder.HasPostgresEnum<InboundReceiptStatus>("public", "inbound_receipt_status");

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

        modelBuilder.Entity<Address>(entity => {
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

        modelBuilder.Entity<Category>(entity => {
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

        modelBuilder.Entity<Coupon>(entity => {
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

        modelBuilder.Entity<CouponUsage>(entity => {
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

        modelBuilder.Entity<InventoryLog>(entity => {
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

        modelBuilder.Entity<MemberTier>(entity => {
            entity.HasKey(e => e.Id).HasName("member_tiers_pkey");
            entity.ToTable("member_tiers");
            entity.HasIndex(e => e.Name, "member_tiers_name_key").IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.DiscountPercent).HasPrecision(5, 2).HasDefaultValueSql("0").HasColumnName("discount_percent");
            entity.Property(e => e.MinPoint).HasDefaultValue(0).HasColumnName("min_point");
            entity.Property(e => e.Name).HasMaxLength(50).HasColumnName("name");
        });

        modelBuilder.Entity<Notification>(entity => {
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

        modelBuilder.Entity<Order>(entity => {
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
                  .HasColumnType("order_status");

            entity.Property(e => e.PaymentStatus)
                  .HasDefaultValue(PaymentStatus.unpaid)
                  .HasColumnName("payment_status")
                  .HasColumnType("payment_status");

            entity.HasOne(d => d.Subscription).WithMany(p => p.Orders).HasForeignKey(d => d.SubscriptionId).HasConstraintName("orders_subscription_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.Orders).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.SetNull).HasConstraintName("orders_user_id_fkey");
        });

        modelBuilder.Entity<OrderItem>(entity => {
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

        modelBuilder.Entity<OrderStatusHistory>(entity => {
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
                  .HasColumnType("order_status");

            entity.Property(e => e.NewStatus)
                  .HasColumnName("new_status")
                  .HasColumnType("order_status");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.OrderStatusHistories).HasForeignKey(d => d.CreatedBy).HasConstraintName("order_status_history_created_by_fkey");
            entity.HasOne(d => d.Order).WithMany(p => p.OrderStatusHistories).HasForeignKey(d => d.OrderId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("order_status_history_order_id_fkey");
        });

        modelBuilder.Entity<PaymentMethod>(entity => {
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

        modelBuilder.Entity<Transaction>(entity => {
            entity.HasKey(e => e.Id).HasName("transactions_pkey");
            entity.ToTable("transactions");

            // Column name mappings (snake_case)
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.SubscriptionId).HasColumnName("subscription_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Provider).HasMaxLength(50).HasColumnName("provider");
            entity.Property(e => e.Amount).HasPrecision(15, 2).HasColumnName("amount");
            entity.Property(e => e.Currency).HasMaxLength(10).HasDefaultValue("VND").HasColumnName("currency");
            entity.Property(e => e.AttemptNumber).HasDefaultValue(1).HasColumnName("attempt_number");
            entity.Property(e => e.ProviderTransactionId).HasMaxLength(100).HasColumnName("provider_transaction_id");
            entity.Property(e => e.ProviderResponse).HasColumnType("jsonb").HasColumnName("provider_response");
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");

            // Enum → string conversion + column name
            entity.Property(e => e.TransactionType)
                  .HasConversion<string>()
                  .HasColumnName("transaction_type");

            entity.Property(e => e.Status)
                  .HasConversion<string>()
                  .HasColumnName("status");

            // Indexes
            entity.HasIndex(e => e.OrderId).HasDatabaseName("idx_transactions_order_id");
            entity.HasIndex(e => e.SubscriptionId).HasDatabaseName("idx_transactions_subscription_id");
            entity.HasIndex(e => e.UserId).HasDatabaseName("idx_transactions_user_id");
            entity.HasIndex(e => e.CreatedAt).HasDatabaseName("idx_transactions_created_at");

            // Foreign Keys
            entity.HasOne(d => d.Order)
                  .WithMany()
                  .HasForeignKey(d => d.OrderId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .HasConstraintName("transactions_order_id_fkey");

            entity.HasOne(d => d.User)
                  .WithMany()
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .HasConstraintName("transactions_user_id_fkey");
        });



        modelBuilder.Entity<Product>(entity => {
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

            // Approval workflow fields
            entity.Property(e => e.ApprovalStatus).HasMaxLength(20).HasDefaultValue("pending").HasColumnName("approval_status");
            entity.Property(e => e.ApprovalNotes).HasColumnName("approval_notes");
            entity.Property(e => e.ApprovedAt).HasColumnName("approved_at");
            entity.Property(e => e.ApprovedBy).HasColumnName("approved_by");
            entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at");
            entity.Property(e => e.RejectedAt).HasColumnName("rejected_at");

            entity.HasOne(d => d.Category).WithMany(p => p.Products).HasForeignKey(d => d.CategoryId).HasConstraintName("products_category_id_fkey");
            entity.HasOne(d => d.Supplier).WithMany(p => p.Products).HasForeignKey(d => d.SupplierId).HasConstraintName("products_supplier_id_fkey");
        });

        modelBuilder.Entity<Review>(entity => {
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

        modelBuilder.Entity<ReviewHelpful>(entity => {
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

        modelBuilder.Entity<Subscription>(entity => {
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
                  .HasColumnType("sub_frequency");

            entity.Property(e => e.Status)
                  .HasDefaultValue(SubStatus.active)
                  .HasColumnName("status")
                  .HasColumnType("sub_status");

            entity.HasOne(d => d.PaymentMethod).WithMany(p => p.Subscriptions).HasForeignKey(d => d.PaymentMethodId).HasConstraintName("subscriptions_payment_method_id_fkey");
            entity.HasOne(d => d.Product).WithMany(p => p.Subscriptions).HasForeignKey(d => d.ProductId).HasConstraintName("subscriptions_product_id_fkey");
            entity.HasOne(d => d.ShippingAddress).WithMany(p => p.Subscriptions).HasForeignKey(d => d.ShippingAddressId).HasConstraintName("subscriptions_shipping_address_id_fkey");
            entity.HasOne(d => d.User).WithMany(p => p.Subscriptions).HasForeignKey(d => d.UserId).HasConstraintName("subscriptions_user_id_fkey");
        });

        modelBuilder.Entity<SubscriptionSchedule>(entity => {
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

        modelBuilder.Entity<SubscriptionConfirmation>(entity => {
            entity.HasKey(e => e.Id).HasName("subscription_confirmations_pkey");
            entity.ToTable("subscription_confirmations");
            entity.HasIndex(e => e.Token, "idx_subscription_confirmations_token").IsUnique();
            entity.HasIndex(e => e.SubscriptionId, "idx_subscription_confirmations_subscription_id");
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()").HasColumnName("id");
            entity.Property(e => e.SubscriptionId).HasColumnName("subscription_id");
            entity.Property(e => e.Token).HasMaxLength(255).HasColumnName("token");
            entity.Property(e => e.ScheduledDeliveryDate).HasColumnName("scheduled_delivery_date");
            entity.Property(e => e.IsConfirmed).HasDefaultValue(false).HasColumnName("is_confirmed");
            entity.Property(e => e.CustomerResponse).HasMaxLength(50).HasColumnName("customer_response");
            entity.Property(e => e.RespondedAt).HasColumnName("responded_at");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");

            entity.HasOne(d => d.Subscription).WithMany().HasForeignKey(d => d.SubscriptionId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("subscription_confirmations_subscription_id_fkey");
        });

        modelBuilder.Entity<Supplier>(entity => {
            entity.HasKey(e => e.Id).HasName("suppliers_pkey");
            entity.ToTable("suppliers");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.StoreName).HasMaxLength(150).HasColumnName("store_name");
            entity.Property(e => e.ContactEmail).HasMaxLength(255).HasColumnName("contact_email");
            entity.Property(e => e.ContactPhone).HasMaxLength(20).HasColumnName("contact_phone");
            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.SupplierUuid).HasDefaultValueSql("extensions.uuid_generate_v4()").HasColumnName("supplier_uuid");
            entity.Property(e => e.SupplierCode).HasMaxLength(50).HasColumnName("supplier_code");
            entity.Property(e => e.BusinessName).HasMaxLength(255).HasColumnName("business_name");
            entity.Property(e => e.BusinessLicense).HasMaxLength(100).HasColumnName("business_license");
            entity.Property(e => e.ContactName).HasMaxLength(255).HasColumnName("contact_name");
            entity.Property(e => e.AddressStreet).HasMaxLength(500).HasColumnName("address_street");
            entity.Property(e => e.AddressWard).HasMaxLength(100).HasColumnName("address_ward");
            entity.Property(e => e.AddressDistrict).HasMaxLength(100).HasColumnName("address_district");
            entity.Property(e => e.AddressCity).HasMaxLength(100).HasColumnName("address_city");
            entity.Property(e => e.TaxCode).HasMaxLength(50).HasColumnName("tax_code");
            entity.Property(e => e.BankAccount).HasMaxLength(50).HasColumnName("bank_account");
            entity.Property(e => e.BankName).HasMaxLength(255).HasColumnName("bank_name");
            entity.Property(e => e.Rating).HasPrecision(3, 2).HasDefaultValue(5.00m).HasColumnName("rating");
            entity.Property(e => e.TotalOrders).HasDefaultValue(0).HasColumnName("total_orders");
            entity.Property(e => e.CompletedOrders).HasDefaultValue(0).HasColumnName("completed_orders");
            entity.Property(e => e.CancelledOrders).HasDefaultValue(0).HasColumnName("cancelled_orders");
            entity.Property(e => e.AvgProcessingTime).HasColumnName("avg_processing_time");
            entity.Property(e => e.SlaComplianceRate).HasPrecision(5, 2).HasDefaultValue(100.00m).HasColumnName("sla_compliance_rate");
            entity.Property(e => e.LateDeliveryCount).HasDefaultValue(0).HasColumnName("late_delivery_count");
            entity.Property(e => e.VerifiedAt).HasColumnName("verified_at");
            entity.Property(e => e.SuspendedAt).HasColumnName("suspended_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.StoreLogoUrl).HasColumnName("store_logo_url");
            entity.Property(e => e.StoreBannerUrl).HasColumnName("store_banner_url");
            entity.Property(e => e.WebsiteUrl).HasMaxLength(500).HasColumnName("website_url");
            entity.Property(e => e.Latitude).HasPrecision(10, 8).HasColumnName("latitude");
            entity.Property(e => e.Longitude).HasPrecision(11, 8).HasColumnName("longitude");
            entity.Property(e => e.BankBranch).HasMaxLength(255).HasColumnName("bank_branch");
            entity.Property(e => e.ReturnedOrders).HasDefaultValue(0).HasColumnName("returned_orders");
            entity.Property(e => e.TotalRevenue).HasPrecision(15, 2).HasDefaultValue(0m).HasColumnName("total_revenue");
            entity.Property(e => e.TotalCommission).HasPrecision(15, 2).HasDefaultValue(0m).HasColumnName("total_commission");
            entity.Property(e => e.PendingPayout).HasPrecision(15, 2).HasDefaultValue(0m).HasColumnName("pending_payout");
            entity.Property(e => e.CommissionRate).HasPrecision(5, 2).HasDefaultValue(15.00m).HasColumnName("commission_rate");
            entity.Property(e => e.LateConfirmationCount).HasDefaultValue(0).HasColumnName("late_confirmation_count");
            entity.Property(e => e.LatePackingCount).HasDefaultValue(0).HasColumnName("late_packing_count");
            entity.Property(e => e.LateShippingCount).HasDefaultValue(0).HasColumnName("late_shipping_count");
            entity.Property(e => e.QualityScore).HasPrecision(5, 2).HasDefaultValue(100.00m).HasColumnName("quality_score");
            entity.Property(e => e.IssueCount).HasDefaultValue(0).HasColumnName("issue_count");
            entity.Property(e => e.ReturnRate).HasPrecision(5, 2).HasDefaultValue(0m).HasColumnName("return_rate");
            entity.Property(e => e.Features).HasColumnType("jsonb").HasColumnName("features");
            entity.Property(e => e.Certifications).HasColumnType("jsonb").HasColumnName("certifications");
            entity.Property(e => e.OperatingHours).HasColumnType("jsonb").HasColumnName("operating_hours");
            entity.Property(e => e.ServiceAreas).HasColumnType("jsonb").HasColumnName("service_areas");
            entity.Property(e => e.MinOrderValue).HasPrecision(15, 2).HasDefaultValue(0m).HasColumnName("min_order_value");
            entity.Property(e => e.AutoConfirmOrders).HasDefaultValue(false).HasColumnName("auto_confirm_orders");
            entity.Property(e => e.IsVerified).HasDefaultValue(false).HasColumnName("is_verified");
            entity.Property(e => e.IsFeatured).HasDefaultValue(false).HasColumnName("is_featured");
            entity.Property(e => e.SuspensionReason).HasColumnName("suspension_reason");
            entity.Property(e => e.LastActivityAt).HasColumnName("last_activity_at");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.DeletedAt).HasColumnName("DeletedAt");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false).HasColumnName("IsDeleted");

            // Business registration fields
            entity.Property(e => e.RegistrationStatus).HasMaxLength(20).HasDefaultValue("pending").HasColumnName("registration_status");
            entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(e => e.ApprovedAt).HasColumnName("approved_at");
            entity.Property(e => e.ApprovedBy).HasColumnName("approved_by");
            entity.Property(e => e.BusinessLicenseUrl).HasColumnName("business_license_url");
            entity.Property(e => e.OperatingRegion).HasMaxLength(50).HasColumnName("operating_region");
            entity.Property(e => e.RegistrationNotes).HasColumnName("registration_notes");
            entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at");

            entity.HasOne(d => d.User)
                .WithMany(p => p.Suppliers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_suppliers_users")
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SupplierProduct>(entity => {
            entity.HasKey(e => e.Id).HasName("supplier_products_pkey");
            entity.ToTable("supplier_products");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("Id");
            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("Name");
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.BasePrice).HasPrecision(15, 2).HasColumnName("BasePrice");
            entity.Property(e => e.CostPrice).HasPrecision(15, 2).HasColumnName("CostPrice");
            entity.Property(e => e.StockQuantity).HasDefaultValue(0).HasColumnName("StockQuantity");
            entity.Property(e => e.LowStockThreshold).HasDefaultValue(10).HasColumnName("LowStockThreshold");
            entity.Property(e => e.Sku).HasMaxLength(50).HasColumnName("Sku");
            entity.Property(e => e.ImageUrl).HasMaxLength(255).HasColumnName("ImageUrl");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("IsActive");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("CreatedAt");
            entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt");
            entity.Property(e => e.SupplierId).HasColumnName("SupplierId");

            entity.HasOne(d => d.Supplier)
                .WithMany(p => p.SupplierProducts)
                .HasForeignKey(d => d.SupplierId)
                .HasConstraintName("fk_supplier_products_suppliers")
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SupplierOrder>(entity => {
            entity.HasKey(e => e.Id).HasName("supplier_orders_pkey");
            entity.ToTable("supplier_orders");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("Id");
            entity.Property(e => e.CustomerName).HasMaxLength(255).HasColumnName("CustomerName");
            entity.Property(e => e.CustomerEmail).HasMaxLength(255).HasColumnName("CustomerEmail");
            entity.Property(e => e.CustomerPhone).HasMaxLength(20).HasColumnName("CustomerPhone");
            entity.Property(e => e.TotalAmount).HasPrecision(15, 2).HasColumnName("TotalAmount");
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("pending").HasColumnName("Status");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("CreatedAt");
            entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt");
            entity.Property(e => e.SupplierId).HasColumnName("SupplierId");

            entity.HasOne(d => d.Supplier)
                .WithMany(p => p.SupplierOrders)
                .HasForeignKey(d => d.SupplierId)
                .HasConstraintName("fk_supplier_orders_suppliers")
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SupplierStats>(entity => {
            entity.HasKey(e => e.Id).HasName("supplier_stats_pkey");
            entity.ToTable("supplier_stats");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("Id");
            entity.Property(e => e.SupplierId).HasColumnName("SupplierId");
            entity.Property(e => e.Date).HasDefaultValueSql("now()").HasColumnName("Date");
            entity.Property(e => e.TotalProducts).HasDefaultValue(0).HasColumnName("TotalProducts");
            entity.Property(e => e.ActiveProducts).HasDefaultValue(0).HasColumnName("ActiveProducts");
            entity.Property(e => e.LowStockProducts).HasDefaultValue(0).HasColumnName("LowStockProducts");
            entity.Property(e => e.TotalOrders).HasDefaultValue(0).HasColumnName("TotalOrders");
            entity.Property(e => e.PendingOrders).HasDefaultValue(0).HasColumnName("PendingOrders");
            entity.Property(e => e.CompletedOrders).HasDefaultValue(0).HasColumnName("CompletedOrders");
            entity.Property(e => e.CancelledOrders).HasDefaultValue(0).HasColumnName("CancelledOrders");
            entity.Property(e => e.TotalRevenue).HasPrecision(15, 2).HasDefaultValue(0m).HasColumnName("TotalRevenue");
            entity.Property(e => e.ThisMonthRevenue).HasPrecision(15, 2).HasDefaultValue(0m).HasColumnName("ThisMonthRevenue");
            entity.Property(e => e.LastMonthRevenue).HasPrecision(15, 2).HasDefaultValue(0m).HasColumnName("LastMonthRevenue");
            entity.Property(e => e.AverageOrderValue).HasDefaultValue(0).HasColumnName("AverageOrderValue");
            entity.Property(e => e.FulfillmentRate).HasDefaultValue(0).HasColumnName("FulfillmentRate");
            entity.Property(e => e.OnTimeDeliveryRate).HasDefaultValue(0).HasColumnName("OnTimeDeliveryRate");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("CreatedAt");
            entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt");

            entity.HasOne(d => d.Supplier)
                .WithMany(p => p.SupplierStats)
                .HasForeignKey(d => d.SupplierId)
                .HasConstraintName("fk_supplier_stats_suppliers")
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SupplierAlert>(entity => {
            entity.HasKey(e => e.Id).HasName("supplier_alerts_pkey");
            entity.ToTable("supplier_alert");
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()").HasColumnName("Id");
            entity.Property(e => e.Type).HasMaxLength(50).HasDefaultValue("system").HasColumnName("Type");
            entity.Property(e => e.Title).HasMaxLength(255).HasColumnName("Title");
            entity.Property(e => e.Message).HasColumnName("Message");
            entity.Property(e => e.Severity).HasMaxLength(20).HasDefaultValue("medium").HasColumnName("Severity");
            entity.Property(e => e.IsRead).HasDefaultValue(false).HasColumnName("IsRead");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("CreatedAt");
            entity.Property(e => e.ReadAt).HasColumnName("ReadAt");
            entity.Property(e => e.ProductId).HasColumnName("ProductId");
            entity.Property(e => e.OrderId).HasColumnName("OrderId");
            entity.Property(e => e.SupplierId).HasColumnName("SupplierId");
            entity.Property(e => e.Data).HasColumnType("jsonb").HasColumnName("Data");

            entity.HasOne(d => d.Supplier)
                .WithMany(p => p.SupplierAlerts)
                .HasForeignKey(d => d.SupplierId)
                .HasConstraintName("fk_supplier_alerts_suppliers")
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ZaloMessagesLog>(entity => {
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

        modelBuilder.Entity<ZaloTemplate>(entity => {
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

        // User Entity Configuration
        modelBuilder.Entity<User>(entity => {
            entity.ToTable("users");
            entity.HasKey(e => e.Id).HasName("users_pkey");
            
            // Primary columns
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Email).HasMaxLength(255).HasColumnName("email");
            entity.Property(e => e.FullName).HasMaxLength(100).HasColumnName("full_name");
            entity.Property(e => e.Role).HasColumnName("role").HasColumnType("user_role");
            entity.Property(e => e.PhoneNumber).HasMaxLength(20).HasColumnName("phone_number");
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(e => e.TierId).HasColumnName("tier_id");
            entity.Property(e => e.LoyaltyPoints).HasDefaultValue(0).HasColumnName("loyalty_points");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnName("updated_at");

            // Email Verification Columns
            entity.Property(e => e.EmailVerified)
                .HasColumnName("email_verified")
                .HasDefaultValue(false);
            entity.Property(e => e.EmailVerificationToken)
                .HasColumnName("email_verification_token")
                .HasMaxLength(255);
            entity.Property(e => e.EmailVerificationExpiry)
                .HasColumnName("email_verification_expiry");

            // Password Reset Columns
            entity.Property(e => e.PasswordResetToken)
                .HasColumnName("password_reset_token")
                .HasMaxLength(255);
            entity.Property(e => e.PasswordResetExpiry)
                .HasColumnName("password_reset_expiry");

            // Relationship with MemberTier
            entity.HasOne(d => d.Tier).WithMany(p => p.Users)
                .HasForeignKey(d => d.TierId).HasConstraintName("users_tier_id_fkey");
        });
        modelBuilder.Entity<LoginLog>(entity => {
            entity.ToTable("login_logs");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.LoginAt).HasColumnName("login_at");
            entity.Property(e => e.IpAddress).HasColumnName("ip_address");
            entity.Property(e => e.UserAgent).HasColumnName("user_agent");
            entity.Property(e => e.DeviceType).HasColumnName("device_type");
            entity.Property(e => e.DeviceName).HasColumnName("device_name");
            entity.Property(e => e.Location).HasColumnName("location");
            entity.Property(e => e.CountryCode).HasColumnName("country_code");
            entity.Property(e => e.Success).HasColumnName("success");
            entity.Property(e => e.FailureReason).HasColumnName("failure_reason");
            entity.Property(e => e.SessionId).HasColumnName("session_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PointsHistory configuration
        modelBuilder.Entity<PointsHistory>(entity => {
            entity.ToTable("points_history");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Points).HasColumnName("points");
            entity.Property(e => e.Type).HasColumnName("type");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.BalanceBefore).HasColumnName("balance_before");
            entity.Property(e => e.BalanceAfter).HasColumnName("balance_after");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Order)
                .WithMany()
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // PaymentLog configuration
        modelBuilder.Entity<PaymentLog>(entity => {
            entity.ToTable("payment_logs");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Amount).HasColumnName("amount");
            entity.Property(e => e.PaymentMethod).HasColumnName("payment_method");
            entity.Property(e => e.PaymentMethodName).HasColumnName("payment_method_name");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.TransactionId).HasColumnName("transaction_id");
            entity.Property(e => e.GatewayResponse).HasColumnName("gateway_response");
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.RefundedAt).HasColumnName("refunded_at");
            entity.Property(e => e.RefundAmount).HasColumnName("refund_amount");
            entity.Property(e => e.RefundReason).HasColumnName("refund_reason");
            entity.Property(e => e.IpAddress).HasColumnName("ip_address");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(e => e.Order)
                .WithMany()
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // =========================================================
        // STAFF MODULE ENTITY CONFIGURATIONS
        // =========================================================

        // Warehouse
        modelBuilder.Entity<Warehouse>(entity => {
            entity.ToTable("warehouses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.AddressStreet).HasColumnName("address_street").HasMaxLength(500);
            entity.Property(e => e.AddressWard).HasColumnName("address_ward").HasMaxLength(100);
            entity.Property(e => e.AddressDistrict).HasColumnName("address_district").HasMaxLength(100);
            entity.Property(e => e.AddressCity).HasColumnName("address_city").HasMaxLength(100);
            entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(20);
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255);
            entity.Property(e => e.Latitude).HasColumnName("latitude").HasPrecision(10, 8);
            entity.Property(e => e.Longitude).HasColumnName("longitude").HasPrecision(11, 8);
            entity.Property(e => e.Capacity).HasColumnName("capacity");
            entity.Property(e => e.Region).HasColumnName("region").HasMaxLength(50);
            entity.Property(e => e.IsDefault).HasColumnName("is_default").HasDefaultValue(false);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Region);
        });

        // StaffWarehouse (many-to-many join table)
        modelBuilder.Entity<StaffWarehouse>(entity => {
            entity.ToTable("staff_warehouses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.StaffId).HasColumnName("staff_id").IsRequired();
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id").IsRequired();
            entity.Property(e => e.IsPrimary).HasColumnName("is_primary").HasDefaultValue(false);
            entity.Property(e => e.AssignedAt).HasColumnName("assigned_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by");
            entity.HasOne(e => e.Staff).WithMany(s => s.StaffWarehouses).HasForeignKey(e => e.StaffId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Warehouse).WithMany(w => w.StaffWarehouses).HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.StaffId, e.WarehouseId }).IsUnique();
        });

        // StaffMember
        modelBuilder.Entity<StaffMember>(entity => {
            entity.ToTable("staff_members");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.EmployeeCode).HasColumnName("employee_code").HasMaxLength(20);
            entity.Property(e => e.Department).HasColumnName("department").HasMaxLength(100);
            entity.Property(e => e.Position).HasColumnName("position").HasMaxLength(100);
            entity.Property(e => e.CanApproveReceipts).HasColumnName("can_approve_receipts").HasDefaultValue(false);
            entity.Property(e => e.CanAdjustInventory).HasColumnName("can_adjust_inventory").HasDefaultValue(false);
            entity.Property(e => e.CanOverrideFifo).HasColumnName("can_override_fifo").HasDefaultValue(false);
            entity.Property(e => e.HireDate).HasColumnName("hire_date");
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Warehouse).WithMany(w => w.StaffMembers).HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.EmployeeCode).IsUnique();
        });

        // SupplierShipment
        modelBuilder.Entity<SupplierShipment>(entity => {
            entity.ToTable("supplier_shipments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ExternalReference).HasColumnName("external_reference").HasMaxLength(100).IsRequired();
            entity.Property(e => e.SupplierId).HasColumnName("supplier_id").IsRequired();
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue(ShipmentStatus.Draft);
            entity.Property(e => e.ExpectedDeliveryDate).HasColumnName("expected_delivery_date").IsRequired();
            entity.Property(e => e.ActualDispatchDate).HasColumnName("actual_dispatch_date");
            entity.Property(e => e.ActualArrivalDate).HasColumnName("actual_arrival_date");
            entity.Property(e => e.TrackingNumber).HasColumnName("tracking_number").HasMaxLength(100);
            entity.Property(e => e.Carrier).HasColumnName("carrier").HasMaxLength(100);
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.TotalValue).HasColumnName("total_value").HasColumnType("decimal(15,2)");
            entity.Property(e => e.TotalItems).HasColumnName("total_items").HasDefaultValue(0);
            entity.Property(e => e.TotalQuantity).HasColumnName("total_quantity").HasDefaultValue(0);
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Supplier).WithMany().HasForeignKey(e => e.SupplierId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Warehouse).WithMany(w => w.Shipments).HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Creator).WithMany().HasForeignKey(e => e.CreatedBy).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.ExternalReference);
            entity.HasIndex(e => e.Status);
        });

        // ShipmentItem
        modelBuilder.Entity<ShipmentItem>(entity => {
            entity.ToTable("shipment_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ShipmentId).HasColumnName("shipment_id").IsRequired();
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.ExpectedQuantity).HasColumnName("expected_quantity").IsRequired();
            entity.Property(e => e.Uom).HasColumnName("uom").HasMaxLength(20).HasDefaultValue("pcs");
            entity.Property(e => e.BatchNumber).HasColumnName("batch_number").HasMaxLength(100);
            entity.Property(e => e.ExpiryDate).HasColumnName("expiry_date");
            entity.Property(e => e.ManufactureDate).HasColumnName("manufacture_date");
            entity.Property(e => e.UnitCost).HasColumnName("unit_cost").HasColumnType("decimal(18,2)");
            entity.Property(e => e.LineTotal).HasColumnName("line_total").HasColumnType("decimal(15,2)");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.ReceivedQuantity).HasColumnName("received_quantity");
            entity.Property(e => e.DamagedQuantity).HasColumnName("damaged_quantity");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(e => e.Shipment).WithMany(s => s.Items).HasForeignKey(e => e.ShipmentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        // ShipmentDocument
        modelBuilder.Entity<ShipmentDocument>(entity => {
            entity.ToTable("shipment_documents");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ShipmentId).HasColumnName("shipment_id").IsRequired();
            entity.Property(e => e.DocumentType).HasColumnName("document_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.FileName).HasColumnName("file_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.FileUrl).HasColumnName("file_url").IsRequired();
            entity.Property(e => e.MimeType).HasColumnName("mime_type").HasMaxLength(100);
            entity.Property(e => e.FileSize).HasColumnName("file_size");
            entity.Property(e => e.UploadedBy).HasColumnName("uploaded_by");
            entity.Property(e => e.UploadedAt).HasColumnName("uploaded_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Shipment).WithMany(s => s.Documents).HasForeignKey(e => e.ShipmentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Uploader).WithMany().HasForeignKey(e => e.UploadedBy).OnDelete(DeleteBehavior.SetNull);
        });

        // ShipmentStatusHistory
        modelBuilder.Entity<ShipmentStatusHistory>(entity => {
            entity.ToTable("shipment_status_history");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ShipmentId).HasColumnName("shipment_id").IsRequired();
            entity.Property(e => e.PreviousStatus).HasColumnName("previous_status");
            entity.Property(e => e.NewStatus).HasColumnName("new_status").IsRequired();
            entity.Property(e => e.PreviousEta).HasColumnName("previous_eta");
            entity.Property(e => e.NewEta).HasColumnName("new_eta");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.Location).HasColumnName("location").HasMaxLength(255);
            entity.Property(e => e.ChangedBy).HasColumnName("changed_by");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Shipment).WithMany(s => s.StatusHistory).HasForeignKey(e => e.ShipmentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ChangedByUser).WithMany().HasForeignKey(e => e.ChangedBy).OnDelete(DeleteBehavior.SetNull);
        });

        // Receipt
        modelBuilder.Entity<Receipt>(entity => {
            entity.ToTable("receipts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ReceiptNumber).HasColumnName("receipt_number").HasMaxLength(50).IsRequired();
            entity.Property(e => e.ShipmentId).HasColumnName("shipment_id").IsRequired();
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id").IsRequired();
            entity.Property(e => e.ReceivedBy).HasColumnName("received_by").IsRequired();
            entity.Property(e => e.InspectedBy).HasColumnName("inspected_by");
            entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue(ReceiptStatus.Pending);
            entity.Property(e => e.ArrivalDate).HasColumnName("arrival_date").IsRequired();
            entity.Property(e => e.InspectionStart).HasColumnName("inspection_start");
            entity.Property(e => e.InspectionEnd).HasColumnName("inspection_end");
            entity.Property(e => e.StoreDate).HasColumnName("store_date");
            entity.Property(e => e.TotalExpected).HasColumnName("total_expected");
            entity.Property(e => e.TotalAccepted).HasColumnName("total_accepted");
            entity.Property(e => e.TotalDamaged).HasColumnName("total_damaged");
            entity.Property(e => e.TotalMissing).HasColumnName("total_missing");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.InspectionNotes).HasColumnName("inspection_notes");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Shipment).WithMany().HasForeignKey(e => e.ShipmentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Warehouse).WithMany(w => w.Receipts).HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ReceivedByStaff).WithMany().HasForeignKey(e => e.ReceivedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.InspectedByStaff).WithMany().HasForeignKey(e => e.InspectedBy).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.ReceiptNumber).IsUnique();
        });

        // ReceiptItem
        modelBuilder.Entity<ReceiptItem>(entity => {
            entity.ToTable("receipt_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ReceiptId).HasColumnName("receipt_id").IsRequired();
            entity.Property(e => e.ShipmentItemId).HasColumnName("shipment_item_id").IsRequired();
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.ExpectedQuantity).HasColumnName("expected_quantity");
            entity.Property(e => e.ReceivedQuantity).HasColumnName("received_quantity");
            entity.Property(e => e.AcceptedQuantity).HasColumnName("accepted_quantity");
            entity.Property(e => e.DamagedQuantity).HasColumnName("damaged_quantity");
            entity.Property(e => e.MissingQuantity).HasColumnName("missing_quantity");
            entity.Property(e => e.QuarantineQuantity).HasColumnName("quarantine_quantity");
            entity.Property(e => e.BatchNumber).HasColumnName("batch_number").HasMaxLength(100);
            entity.Property(e => e.ExpiryDate).HasColumnName("expiry_date");
            entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue(ReceiptStatus.Pending);
            entity.Property(e => e.QcRequired).HasColumnName("qc_required").HasDefaultValue(false);
            entity.Property(e => e.QcPassed).HasColumnName("qc_passed");
            entity.Property(e => e.QcSampleSize).HasColumnName("qc_sample_size");
            entity.Property(e => e.QcPassedCount).HasColumnName("qc_passed_count");
            entity.Property(e => e.QcNotes).HasColumnName("qc_notes");
            entity.Property(e => e.InspectionNotes).HasColumnName("inspection_notes");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Receipt).WithMany(r => r.Items).HasForeignKey(e => e.ReceiptId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ShipmentItem).WithMany().HasForeignKey(e => e.ShipmentItemId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        // WarehouseInventory
        modelBuilder.Entity<WarehouseInventory>(entity => {
            entity.ToTable("warehouse_inventory");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id").IsRequired();
            entity.Property(e => e.Quantity).HasColumnName("quantity").HasDefaultValue(0);
            entity.Property(e => e.ReservedQuantity).HasColumnName("reserved_quantity").HasDefaultValue(0);
            entity.Property(e => e.BatchNumber).HasColumnName("batch_number").HasMaxLength(100);
            entity.Property(e => e.ExpiryDate).HasColumnName("expiry_date");
            entity.Property(e => e.ManufactureDate).HasColumnName("manufacture_date");
            entity.Property(e => e.UnitCost).HasColumnName("unit_cost").HasColumnType("decimal(18,2)");
            entity.Property(e => e.Location).HasColumnName("location").HasMaxLength(100);
            entity.Property(e => e.InventoryType).HasColumnName("inventory_type").HasDefaultValue(InventoryType.Available);
            entity.Property(e => e.MinStockLevel).HasColumnName("min_stock_level");
            entity.Property(e => e.MaxStockLevel).HasColumnName("max_stock_level");
            entity.Property(e => e.AvailableQuantity).HasColumnName("available_quantity");
            entity.Property(e => e.LocationCode).HasColumnName("location_code").HasMaxLength(100);
            entity.Property(e => e.SupplierId).HasColumnName("supplier_id");
            entity.Property(e => e.ReceiptId).HasColumnName("receipt_id");
            entity.Property(e => e.ReorderPoint).HasColumnName("reorder_point");
            entity.Property(e => e.ReorderQuantity).HasColumnName("reorder_quantity");
            entity.Property(e => e.LastCountedAt).HasColumnName("last_counted_at");
            entity.Property(e => e.ReceivedAt).HasColumnName("received_at");
            entity.Property(e => e.SourceShipmentId).HasColumnName("source_shipment_id");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValue(1).IsConcurrencyToken();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Warehouse).WithMany(w => w.Inventories).HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Supplier).WithMany().HasForeignKey(e => e.SupplierId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Receipt).WithMany().HasForeignKey(e => e.ReceiptId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => new { e.ProductId, e.WarehouseId, e.BatchNumber, e.ExpiryDate, e.InventoryType }).IsUnique();
        });

        // StockMovement
        modelBuilder.Entity<StockMovement>(entity => {
            entity.ToTable("stock_movements");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.InventoryId).HasColumnName("inventory_id").IsRequired();
            entity.Property(e => e.MovementType).HasColumnName("movement_type").IsRequired();
            entity.Property(e => e.QuantityChange).HasColumnName("quantity_change").IsRequired();
            entity.Property(e => e.QuantityBefore).HasColumnName("quantity_before");
            entity.Property(e => e.QuantityAfter).HasColumnName("quantity_after");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id").IsRequired();
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.BatchNumber).HasColumnName("batch_number").HasMaxLength(100);
            entity.Property(e => e.ReferenceType).HasColumnName("reference_type").HasMaxLength(50);
            entity.Property(e => e.ReferenceId).HasColumnName("reference_id");
            entity.Property(e => e.UnitCost).HasColumnName("unit_cost").HasColumnType("decimal(15,2)");
            entity.Property(e => e.TotalCost).HasColumnName("total_cost").HasColumnType("decimal(15,2)");
            entity.Property(e => e.Reason).HasColumnName("reason").HasMaxLength(255);
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.ApprovedBy).HasColumnName("approved_by");
            entity.Property(e => e.IsFifoOverride).HasColumnName("is_fifo_override").HasDefaultValue(false);
            entity.Property(e => e.OverrideReason).HasColumnName("override_reason");
            entity.Property(e => e.PerformedBy).HasColumnName("performed_by");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Inventory).WithMany().HasForeignKey(e => e.InventoryId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Warehouse).WithMany().HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.PerformedByStaff).WithMany().HasForeignKey(e => e.PerformedBy).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.ApprovedByStaff).WithMany().HasForeignKey(e => e.ApprovedBy).OnDelete(DeleteBehavior.SetNull);
        });

        // StockReservation
        modelBuilder.Entity<StockReservation>(entity => {
            entity.ToTable("stock_reservations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.InventoryId).HasColumnName("inventory_id").IsRequired();
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.OrderItemId).HasColumnName("order_item_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("active");
            entity.Property(e => e.ReservedAt).HasColumnName("reserved_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.FulfilledAt).HasColumnName("fulfilled_at");
            entity.Property(e => e.CancelledAt).HasColumnName("cancelled_at");
            entity.Property(e => e.ReservedBy).HasColumnName("reserved_by");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.HasOne(e => e.Inventory).WithMany().HasForeignKey(e => e.InventoryId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Order).WithMany().HasForeignKey(e => e.OrderId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.ReservedByUser).WithMany().HasForeignKey(e => e.ReservedBy).OnDelete(DeleteBehavior.SetNull);
        });

        // DiscrepancyReport
        modelBuilder.Entity<DiscrepancyReport>(entity => {
            entity.ToTable("discrepancy_reports");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ReportNumber).HasColumnName("report_number").HasMaxLength(50).IsRequired();
            entity.Property(e => e.ShipmentId).HasColumnName("shipment_id").IsRequired();
            entity.Property(e => e.ReceiptId).HasColumnName("receipt_id");
            entity.Property(e => e.SupplierId).HasColumnName("supplier_id").IsRequired();
            entity.Property(e => e.DiscrepancyType).HasColumnName("discrepancy_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("draft");
            entity.Property(e => e.Description).HasColumnName("description").IsRequired();
            entity.Property(e => e.AffectedQuantity).HasColumnName("affected_quantity");
            entity.Property(e => e.AffectedValue).HasColumnName("affected_value").HasColumnType("decimal(18,2)");
            entity.Property(e => e.SupplierNotifiedAt).HasColumnName("supplier_notified_at");
            entity.Property(e => e.SupplierResponse).HasColumnName("supplier_response");
            entity.Property(e => e.SupplierResponseAt).HasColumnName("supplier_response_at");
            entity.Property(e => e.ResolutionType).HasColumnName("resolution_type").HasMaxLength(50);
            entity.Property(e => e.ResolutionNotes).HasColumnName("resolution_notes");
            entity.Property(e => e.ResolvedBy).HasColumnName("resolved_by");
            entity.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
            entity.Property(e => e.ReportedBy).HasColumnName("reported_by").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Shipment).WithMany().HasForeignKey(e => e.ShipmentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Receipt).WithMany().HasForeignKey(e => e.ReceiptId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Supplier).WithMany().HasForeignKey(e => e.SupplierId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ReportedByStaff).WithMany().HasForeignKey(e => e.ReportedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ResolvedByUser).WithMany().HasForeignKey(e => e.ResolvedBy).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.ReportNumber).IsUnique();
        });

        // DiscrepancyItem
        modelBuilder.Entity<DiscrepancyItem>(entity => {
            entity.ToTable("discrepancy_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.DiscrepancyReportId).HasColumnName("discrepancy_report_id").IsRequired();
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.ShipmentItemId).HasColumnName("shipment_item_id");
            entity.Property(e => e.DiscrepancyType).HasColumnName("discrepancy_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.ExpectedQuantity).HasColumnName("expected_quantity");
            entity.Property(e => e.ActualQuantity).HasColumnName("actual_quantity");
            entity.Property(e => e.DiscrepancyQuantity).HasColumnName("discrepancy_quantity");
            entity.Property(e => e.BatchNumber).HasColumnName("batch_number").HasMaxLength(100);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.EvidenceUrls).HasColumnName("evidence_urls").HasColumnType("jsonb");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.DiscrepancyReport).WithMany(d => d.Items).HasForeignKey(e => e.DiscrepancyReportId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product).WithMany().HasForeignKey(e => e.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ShipmentItem).WithMany().HasForeignKey(e => e.ShipmentItemId).OnDelete(DeleteBehavior.SetNull);
        });

        // ReturnShipment
        modelBuilder.Entity<ReturnShipment>(entity => {
            entity.ToTable("return_shipments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ReturnNumber).HasColumnName("return_number").HasMaxLength(50).IsRequired();
            entity.Property(e => e.OriginalShipmentId).HasColumnName("original_shipment_id").IsRequired();
            entity.Property(e => e.DiscrepancyReportId).HasColumnName("discrepancy_report_id");
            entity.Property(e => e.SupplierId).HasColumnName("supplier_id").IsRequired();
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("draft");
            entity.Property(e => e.ReturnReason).HasColumnName("return_reason").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.TotalItems).HasColumnName("total_items");
            entity.Property(e => e.TotalQuantity).HasColumnName("total_quantity");
            entity.Property(e => e.TotalValue).HasColumnName("total_value").HasColumnType("decimal(18,2)");
            entity.Property(e => e.TrackingNumber).HasColumnName("tracking_number").HasMaxLength(100);
            entity.Property(e => e.Carrier).HasColumnName("carrier").HasMaxLength(100);
            entity.Property(e => e.ShippedAt).HasColumnName("shipped_at");
            entity.Property(e => e.SupplierReceivedAt).HasColumnName("supplier_received_at");
            entity.Property(e => e.CreditStatus).HasColumnName("credit_status").HasMaxLength(50);
            entity.Property(e => e.CreditAmount).HasColumnName("credit_amount").HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreditIssuedAt).HasColumnName("credit_issued_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by").IsRequired();
            entity.Property(e => e.ApprovedBy).HasColumnName("approved_by");
            entity.Property(e => e.ApprovedAt).HasColumnName("approved_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.OriginalShipment).WithMany().HasForeignKey(e => e.OriginalShipmentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.DiscrepancyReport).WithMany().HasForeignKey(e => e.DiscrepancyReportId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Supplier).WithMany().HasForeignKey(e => e.SupplierId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Warehouse).WithMany().HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Creator).WithMany().HasForeignKey(e => e.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Approver).WithMany().HasForeignKey(e => e.ApprovedBy).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.ReturnNumber).IsUnique();
        });

        // ReturnItem
        modelBuilder.Entity<ReturnItem>(entity => {
            entity.ToTable("return_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ReturnShipmentId).HasColumnName("return_shipment_id").IsRequired();
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.ShipmentItemId).HasColumnName("shipment_item_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity").IsRequired();
            entity.Property(e => e.BatchNumber).HasColumnName("batch_number").HasMaxLength(100);
            entity.Property(e => e.ReturnReason).HasColumnName("return_reason").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.UnitCost).HasColumnName("unit_cost").HasColumnType("decimal(18,2)");
            entity.Property(e => e.LineTotal).HasColumnName("line_total").HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.ReturnShipment).WithMany(r => r.Items).HasForeignKey(e => e.ReturnShipmentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ShipmentItem)
                .WithMany()
                .HasForeignKey(e => e.ShipmentItemId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}