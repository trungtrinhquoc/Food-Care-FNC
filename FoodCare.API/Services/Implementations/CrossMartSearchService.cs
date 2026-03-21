using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Products;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations;

public class CrossMartSearchService : ICrossMartSearchService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<CrossMartSearchService> _logger;
    private const double EarthRadiusKm = 6371.0;
    private const decimal FreeShippingThreshold = 150_000m;

    public CrossMartSearchService(FoodCareDbContext context, ILogger<CrossMartSearchService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<(List<CrossMartProductResultDto> Products, int TotalCount)> SearchAcrossMartsAsync(CrossMartSearchDto query, Guid? userId)
    {
        var userLat = (double)query.Latitude;
        var userLng = (double)query.Longitude;

        // Get active subscription total per mart for the user (for free shipping calculation)
        var userSubTotals = new Dictionary<int, decimal>();
        if (userId.HasValue)
        {
            userSubTotals = await _context.Subscriptions
                .Where(s => s.UserId == userId.Value && s.Status == SubStatus.active && s.Product != null)
                .GroupBy(s => s.Product!.SupplierId ?? 0)
                .Select(g => new { MartId = g.Key, Total = g.Sum(s => (s.Product!.BasePrice * (s.Quantity ?? 1))) })
                .ToDictionaryAsync(x => x.MartId, x => x.Total);
        }

        // Get all nearby active marts with coordinates
        var marts = await _context.Suppliers
            .Where(s => s.IsActive == true && s.IsVerified == true && s.IsDeleted != true
                      && s.Latitude != null && s.Longitude != null)
            .Select(s => new { s.Id, s.StoreName, s.Rating, Lat = (double)s.Latitude!.Value, Lng = (double)s.Longitude!.Value })
            .ToListAsync();

        var nearbyMartIds = marts
            .Where(m => CalculateDistance(userLat, userLng, m.Lat, m.Lng) <= query.RadiusKm)
            .ToDictionary(m => m.Id, m => new { m.StoreName, m.Rating, Distance = CalculateDistance(userLat, userLng, m.Lat, m.Lng) });

        if (nearbyMartIds.Count == 0)
            return (new List<CrossMartProductResultDto>(), 0);

        // Search products across nearby marts
        var searchTerm = $"%{query.Query}%";
        var productQuery = _context.Products
            .Where(p => p.IsActive == true && p.IsDeleted != true && p.ApprovalStatus == "approved"
                      && p.SupplierId != null && nearbyMartIds.Keys.Contains(p.SupplierId.Value))
            .Where(p => EF.Functions.ILike(p.Name, searchTerm)
                     || (p.Manufacturer != null && EF.Functions.ILike(p.Manufacturer, searchTerm))
                     || (p.Origin != null && EF.Functions.ILike(p.Origin, searchTerm)));

        var totalCount = await productQuery.CountAsync();

        var products = await productQuery.ToListAsync();

        var results = products.Select(p =>
        {
            var martId = p.SupplierId!.Value;
            var martInfo = nearbyMartIds[martId];
            var subTotal = userSubTotals.GetValueOrDefault(martId, 0);
            var isFreeShipping = subTotal >= FreeShippingThreshold;

            return new CrossMartProductResultDto
            {
                ProductId = p.Id,
                Name = p.Name,
                Manufacturer = p.Manufacturer,
                Origin = p.Origin,
                Images = p.Images,
                BasePrice = p.BasePrice,
                OriginalPrice = p.OriginalPrice,
                StockQuantity = p.StockQuantity,
                StockStatus = p.StockQuantity == null ? "Còn hàng"
                            : p.StockQuantity <= 0 ? "Hết hàng"
                            : p.StockQuantity <= 5 ? $"Còn {p.StockQuantity} cái"
                            : "Còn hàng",
                RatingAverage = p.RatingAverage,
                RatingCount = p.RatingCount,
                MartId = martId,
                MartName = martInfo.StoreName,
                DistanceKm = Math.Round(martInfo.Distance, 2),
                MartRating = martInfo.Rating,
                ShippingDisplay = isFreeShipping ? "Miễn ship" : "+15.000đ",
                IsFreeShipping = isFreeShipping
            };
        }).ToList();

        // Sort
        results = query.SortBy?.ToLower() switch
        {
            "price_asc" => results.OrderBy(r => r.BasePrice).ToList(),
            "distance" => results.OrderBy(r => r.DistanceKm).ToList(),
            "popularity" => results.OrderByDescending(r => r.RatingCount ?? 0).ToList(),
            _ => results.OrderBy(r => r.DistanceKm).ThenByDescending(r => r.RatingAverage ?? 0).ToList()
        };

        // Paginate
        var paged = results
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToList();

        return (paged, totalCount);
    }

    public async Task<List<ProductVariantDto>> GetProductVariantsAsync(Guid productId, int martId)
    {
        // Get the source product to find category
        var sourceProduct = await _context.Products
            .Where(p => p.Id == productId)
            .Select(p => new { p.CategoryId, p.Name })
            .FirstOrDefaultAsync();

        if (sourceProduct == null || sourceProduct.CategoryId == null)
            return new List<ProductVariantDto>();

        // Find similar products in the same category from the same mart
        var variants = await _context.Products
            .Where(p => p.SupplierId == martId
                     && p.CategoryId == sourceProduct.CategoryId
                     && p.IsActive == true
                     && p.IsDeleted != true
                     && p.ApprovalStatus == "approved")
            .OrderByDescending(p => p.RatingCount ?? 0)
            .Take(3)
            .Select(p => new ProductVariantDto
            {
                ProductId = p.Id,
                Name = p.Name,
                Manufacturer = p.Manufacturer,
                Origin = p.Origin,
                Images = p.Images,
                BasePrice = p.BasePrice,
                RatingAverage = p.RatingAverage,
                RatingCount = p.RatingCount,
                IsPopular = false
            })
            .ToListAsync();

        // Mark most popular
        if (variants.Count > 0)
            variants[0].IsPopular = true;

        return variants;
    }

    public async Task<List<AlternativeMartDto>> GetAlternativeMartsAsync(Guid productId, decimal latitude, decimal longitude, double radiusKm = 3.0)
    {
        var userLat = (double)latitude;
        var userLng = (double)longitude;

        // Get the product name for searching similar products in other marts
        var product = await _context.Products
            .Where(p => p.Id == productId)
            .Select(p => new { p.Name, p.CategoryId })
            .FirstOrDefaultAsync();

        if (product == null)
            return new List<AlternativeMartDto>();

        // Find same product (by name) in other marts
        var searchTerm = $"%{product.Name}%";
        var alternatives = await _context.Products
            .Include(p => p.Supplier)
            .Where(p => p.IsActive == true && p.IsDeleted != true && p.ApprovalStatus == "approved"
                      && p.SupplierId != null
                      && p.Supplier != null
                      && p.Supplier.IsActive == true
                      && p.Supplier.IsVerified == true
                      && p.Supplier.IsDeleted != true
                      && p.Supplier.Latitude != null
                      && p.Supplier.Longitude != null
                      && (p.CategoryId == product.CategoryId || EF.Functions.ILike(p.Name, searchTerm)))
            .Select(p => new
            {
                p.Supplier!.Id,
                MartName = p.Supplier.StoreName,
                MartRating = p.Supplier.Rating,
                MartLat = (double)p.Supplier.Latitude!.Value,
                MartLng = (double)p.Supplier.Longitude!.Value,
                p.BasePrice,
                p.StockQuantity
            })
            .ToListAsync();

        return alternatives
            .Select(a => new
            {
                a.Id, a.MartName, a.MartRating, a.BasePrice, a.StockQuantity,
                Distance = CalculateDistance(userLat, userLng, a.MartLat, a.MartLng)
            })
            .Where(a => a.Distance <= radiusKm)
            .OrderBy(a => a.Distance)
            .Take(5)
            .Select(a => new AlternativeMartDto
            {
                MartId = a.Id,
                MartName = a.MartName,
                DistanceKm = Math.Round(a.Distance, 2),
                ProductPrice = a.BasePrice,
                StockQuantity = a.StockQuantity,
                StockStatus = a.StockQuantity == null ? "Còn hàng"
                            : a.StockQuantity <= 0 ? "Hết hàng"
                            : a.StockQuantity <= 5 ? $"Còn {a.StockQuantity} cái"
                            : "Còn hàng",
                MartRating = a.MartRating
            })
            .ToList();
    }

    public async Task<bool> SubscribeToAvailabilityAsync(Guid userId, Guid productId, int martId)
    {
        var existing = await _context.ProductAvailabilityNotifications
            .AnyAsync(n => n.UserId == userId && n.ProductId == productId && n.MartId == martId);

        if (existing) return true; // Already subscribed

        _context.ProductAvailabilityNotifications.Add(new ProductAvailabilityNotification
        {
            UserId = userId,
            ProductId = productId,
            MartId = martId
        });

        await _context.SaveChangesAsync();
        _logger.LogInformation("User {UserId} subscribed to availability for product {ProductId} at mart {MartId}", userId, productId, martId);
        return true;
    }

    private static double CalculateDistance(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLng = (lng2 - lng1) * Math.PI / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return EarthRadiusKm * 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
