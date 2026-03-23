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
        var keyword = (query.Query ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(keyword))
            return (new List<CrossMartProductResultDto>(), 0);

        var userLat = (double)query.Latitude;
        var userLng = (double)query.Longitude;
        var useRadiusFilter = query.RadiusKm > 0;
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 200);

        // Prefer persisted user location from default address to avoid realtime GPS/API dependency on each search.
        if (userId.HasValue)
        {
            var defaultAddress = await _context.Addresses
                .Where(a => a.UserId == userId.Value && a.IsDefault == true && a.Latitude != null && a.Longitude != null)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new { a.Latitude, a.Longitude })
                .FirstOrDefaultAsync();

            if (defaultAddress != null)
            {
                userLat = (double)defaultAddress.Latitude!.Value;
                userLng = (double)defaultAddress.Longitude!.Value;
            }
        }

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

        // Get all active marts. Keep marts without coordinates so system-wide search does not hide their products.
        var marts = await _context.Suppliers
            .Where(s => s.IsActive == true && s.IsVerified == true && s.IsDeleted != true
            )
            .Select(s => new
            {
                s.Id,
                s.StoreName,
                s.Rating,
                Lat = s.Latitude,
                Lng = s.Longitude
            })
            .ToListAsync();

        var nearbyMartIds = marts
            .Select(m => new
            {
                m.Id,
                m.StoreName,
                m.Rating,
                HasCoordinates = m.Lat.HasValue && m.Lng.HasValue,
                Distance = (m.Lat.HasValue && m.Lng.HasValue)
                    ? CalculateDistance(userLat, userLng, (double)m.Lat.Value, (double)m.Lng.Value)
                    : -1d
            })
            .Where(m => !useRadiusFilter || (m.HasCoordinates && m.Distance <= query.RadiusKm))
            .ToDictionary(m => m.Id, m => new { m.StoreName, m.Rating, m.Distance });

        if (nearbyMartIds.Count == 0)
            return (new List<CrossMartProductResultDto>(), 0);

        // Search products across nearby marts.
        // Token-based matching avoids missing results when product name words are separated by other words.
        var tokens = keyword
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .ToList();

        var productQuery = _context.Products
            .Where(p => p.IsActive == true && p.IsDeleted != true && p.ApprovalStatus == "approved"
                      && p.SupplierId != null && nearbyMartIds.Keys.Contains(p.SupplierId.Value)
                      && p.StockQuantity != null && p.StockQuantity > 0)
            .AsQueryable();

        foreach (var token in tokens)
        {
            var t = token;
            var tokenPattern = $"%{t}%";
            productQuery = productQuery.Where(p =>
                EF.Functions.ILike(p.Name, tokenPattern)
                || (p.Manufacturer != null && EF.Functions.ILike(p.Manufacturer, tokenPattern))
                || (p.Origin != null && EF.Functions.ILike(p.Origin, tokenPattern))
            );
        }

        var totalCount = await productQuery.CountAsync();

        var products = await productQuery.ToListAsync();

        var productIds = products.Select(p => p.Id).ToList();
        var soldByProduct = await _context.OrderItems
            .Where(oi => oi.ProductId != null
                      && productIds.Contains(oi.ProductId.Value)
                      && oi.Order != null
                      && oi.Order.Status == OrderStatus.delivered)
            .GroupBy(oi => oi.ProductId!.Value)
            .Select(g => new { ProductId = g.Key, SoldCount = g.Sum(x => x.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.SoldCount);

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
            "price" => results.OrderBy(r => r.BasePrice).ToList(),
            "price_low" => results.OrderBy(r => r.BasePrice).ToList(),
            "distance" => results.OrderBy(r => r.DistanceKm < 0 ? double.MaxValue : r.DistanceKm).ToList(),
            "nearest" => results.OrderBy(r => r.DistanceKm < 0 ? double.MaxValue : r.DistanceKm).ToList(),
            "popularity" => results.OrderByDescending(r => soldByProduct.GetValueOrDefault(r.ProductId, 0)).ToList(),
            "popular" => results.OrderByDescending(r => soldByProduct.GetValueOrDefault(r.ProductId, 0)).ToList(),
            _ => results
                .OrderBy(r => r.DistanceKm < 0 ? double.MaxValue : r.DistanceKm)
                .ThenByDescending(r => r.RatingAverage ?? 0)
                .ToList()
        };

        // Paginate
        var paged = results
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return (paged, totalCount);
    }

    public async Task<List<ProductVariantDto>> GetProductVariantsAsync(Guid productId, int martId)
    {
        // Get source product name to compare exact product variants in the same mart.
        var sourceProduct = await _context.Products
            .Where(p => p.Id == productId)
            .Select(p => new { p.Name })
            .FirstOrDefaultAsync();

        if (sourceProduct == null)
            return new List<ProductVariantDto>();

        var baseVariants = await _context.Products
            .Where(p => p.SupplierId == martId
                     && p.Name == sourceProduct.Name
                     && p.IsActive == true
                     && p.IsDeleted != true
                     && p.ApprovalStatus == "approved")
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
                SoldCount = 0,
                IsPopular = false
            })
            .ToListAsync();

        if (baseVariants.Count == 0)
            return baseVariants;

        var variantIds = baseVariants.Select(v => v.ProductId).ToList();

        var soldByProduct = await _context.OrderItems
            .Where(oi => oi.ProductId != null && variantIds.Contains(oi.ProductId.Value))
            .GroupBy(oi => oi.ProductId!.Value)
            .Select(g => new { ProductId = g.Key, SoldCount = g.Sum(x => x.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.SoldCount);

        var variants = baseVariants
            .Select(v =>
            {
                v.SoldCount = soldByProduct.GetValueOrDefault(v.ProductId, 0);
                return v;
            })
            .OrderByDescending(v => v.SoldCount)
            .ThenByDescending(v => v.RatingCount ?? 0)
            .Take(3)
            .ToList();

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
