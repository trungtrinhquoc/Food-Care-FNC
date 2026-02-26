using AutoMapper;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Auth;
using FoodCare.API.Models.DTOs.Orders;
using FoodCare.API.Models.DTOs.Products;
using FoodCare.API.Models.DTOs.Subscriptions;
using FoodCare.API.Models.DTOs.Suppliers;
using FoodCare.API.Models.Suppliers;

namespace FoodCare.API.Helpers;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()))
            .ForMember(dest => dest.LoyaltyPoints, opt => opt.MapFrom(src => src.LoyaltyPoints ?? 0))
            .ForMember(dest => dest.MemberTier, opt => opt.MapFrom(src => src.Tier));
        
        // MemberTier mappings
        CreateMap<MemberTier, MemberTierDto>();
        
        // Product mappings
        CreateMap<Product, ProductDto>()
            .ForMember(dest => dest.BasePrice, opt => opt.MapFrom(src => src.BasePrice))
            .ForMember(dest => dest.Sku, opt => opt.MapFrom(src => src.Sku ?? ""))
            .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.Images != null ? src.Images : null)) // Simplified image mapping
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
            .ForMember(dest => dest.SupplierId, opt => opt.MapFrom(src => src.SupplierId))
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier != null ? src.Supplier.StoreName : null))
            .ForMember(dest => dest.StockQuantity, opt => opt.MapFrom(src => src.StockQuantity ?? 0))
            .ForMember(dest => dest.RatingAverage, opt => opt.MapFrom(src => src.RatingAverage ?? 0))
            .ForMember(dest => dest.RatingCount, opt => opt.MapFrom(src => src.RatingCount ?? 0))
            .ForMember(dest => dest.IsSubscriptionAvailable, opt => opt.MapFrom(src => src.IsSubscriptionAvailable ?? false))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive ?? true));
        
        CreateMap<CreateProductDto, Product>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.BasePrice, opt => opt.MapFrom(src => src.BasePrice))
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images))
            .ForMember(dest => dest.Slug, opt => opt.MapFrom(src => GenerateSlug(src.Name)))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.RatingAverage, opt => opt.MapFrom(src => 0))
            .ForMember(dest => dest.RatingCount, opt => opt.MapFrom(src => 0));
        
        CreateMap<UpdateProductDto, Product>()
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images))
            .ForMember(dest => dest.BasePrice, opt => opt.MapFrom(src => src.BasePrice))
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        
        // Category mappings
        CreateMap<Category, CategoryDto>();
        CreateMap<Subscription, SubscriptionDto>();
            CreateMap<Order, OrdersDto>()
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.OrderItems));
        CreateMap<OrderItem, OrdersItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => !string.IsNullOrEmpty(src.ProductName) ? src.ProductName : (src.Product != null ? src.Product.Name : string.Empty)))
            .ForMember(dest => dest.UnitPrice, opt => opt.MapFrom(src => src.Price))
            .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.TotalPrice ?? (src.Price * src.Quantity)))
            .ForMember(dest => dest.IsSubscription, opt => opt.MapFrom(src => ParseIsSubscription(src.VariantSnapshot)))
            .ForMember(dest => dest.SubscriptionFrequency, opt => opt.MapFrom(src => ParseFrequency(src.VariantSnapshot)))
            .ForMember(dest => dest.ProductImageUrl, opt => opt.MapFrom(src => src.Product != null ? src.Product.Images : null));

        // Supplier mappings
        CreateMap<Supplier, SupplierDto>()
            .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.Products != null ? src.Products.Count(p => p.IsDeleted != true) : 0));
            
        CreateMap<CreateSupplierDto, Supplier>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.Products, opt => opt.Ignore());
            
        CreateMap<UpdateSupplierDto, Supplier>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            
        // Supplier role mappings
        CreateMap<Supplier, SupplierProfileDto>()
            .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.Products != null ? src.Products.Count(p => p.IsDeleted != true) : 0))
            .ForMember(dest => dest.TotalRevenue, opt => opt.MapFrom(src => 0)) // TODO: Calculate from orders
            .ForMember(dest => dest.TotalOrders, opt => opt.MapFrom(src => 0)); // TODO: Calculate from orders
            
        CreateMap<Product, SupplierProductDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.ApprovalStatus ?? "pending"))
            .ForMember(dest => dest.OrderCount, opt => opt.MapFrom(src => 0)) // TODO: Calculate from orders
            .ForMember(dest => dest.TotalRevenue, opt => opt.MapFrom(src => 0)); // TODO: Calculate from orders
    }

    private static bool ParseIsSubscription(string? snapshot)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(snapshot);
            if (doc.RootElement.TryGetProperty("isSubscription", out var prop))
            {
                return prop.GetBoolean();
            }
        }
        catch { }
        return false;
    }

    private static string? ParseFrequency(string? snapshot)
    {
        if (string.IsNullOrEmpty(snapshot)) return null;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(snapshot);
            if (doc.RootElement.TryGetProperty("subscription", out var sub) &&
                sub.TryGetProperty("frequency", out var freq))
            {
                return freq.GetString();
            }
        }
        catch { }
        return null;
    }

    private static string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        text = text.ToLowerInvariant();
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", "-");
        text = System.Text.RegularExpressions.Regex.Replace(text, @"[^a-z0-9\-]", "");
        text = System.Text.RegularExpressions.Regex.Replace(text, @"-+", "-");
        text = text.Trim('-');

        return text;
    }

}
