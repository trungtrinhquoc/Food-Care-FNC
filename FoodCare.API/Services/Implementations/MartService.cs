using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Mart;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations;

public class MartService : IMartService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<MartService> _logger;

    // Earth radius in kilometers for Haversine formula
    private const double EarthRadiusKm = 6371.0;

    public MartService(FoodCareDbContext context, ILogger<MartService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<NearbyMartDto>> GetNearbyMartsAsync(NearbyMartQueryDto query)
    {
        _logger.LogInformation(
            "Searching nearby marts at ({Lat}, {Lng}) within {Radius}km",
            query.Latitude, query.Longitude, query.RadiusKm);

        var userLat = (double)query.Latitude;
        var userLng = (double)query.Longitude;
        var radiusKm = query.RadiusKm;

        // Query active, verified suppliers with geolocation
        var suppliers = await _context.Suppliers
            .Include(s => s.Products)
            .Where(s => s.IsActive == true
                     && s.IsVerified == true
                     && s.IsDeleted != true
                     && s.Latitude != null
                     && s.Longitude != null)
            .Select(s => new
            {
                Supplier = s,
                Lat = (double)s.Latitude!.Value,
                Lng = (double)s.Longitude!.Value,
                ProductCount = s.Products.Count(p => p.IsActive == true && p.IsDeleted != true && p.ApprovalStatus == "approved")
            })
            .ToListAsync();

        // Calculate distance in-memory using Haversine
        var nearbyMarts = suppliers
            .Select(s => new
            {
                s.Supplier,
                s.ProductCount,
                Distance = CalculateHaversineDistance(userLat, userLng, s.Lat, s.Lng)
            })
            .Where(s => s.Distance <= radiusKm)
            .OrderBy(s => s.Distance)
            .ThenByDescending(s => s.Supplier.Rating ?? 0)
            .ThenByDescending(s => s.ProductCount)
            .Take(query.MaxResults)
            .ToList();

        var result = nearbyMarts.Select((m, index) => new NearbyMartDto
        {
            Id = m.Supplier.Id,
            StoreName = m.Supplier.StoreName,
            StoreLogoUrl = m.Supplier.StoreLogoUrl,
            StoreBannerUrl = m.Supplier.StoreBannerUrl,
            Rating = m.Supplier.Rating,
            ProductCount = m.ProductCount,
            DistanceKm = Math.Round(m.Distance, 2),
            Address = m.Supplier.Address,
            AddressStreet = m.Supplier.AddressStreet,
            AddressWard = m.Supplier.AddressWard,
            AddressDistrict = m.Supplier.AddressDistrict,
            AddressCity = m.Supplier.AddressCity,
            Certifications = m.Supplier.Certifications,
            OperatingHours = m.Supplier.OperatingHours,
            Features = m.Supplier.Features,
            MinOrderValue = m.Supplier.MinOrderValue,
            IsPreSelected = index == 0  // First result is pre-selected
        }).ToList();

        _logger.LogInformation("Found {Count} marts within {Radius}km", result.Count, radiusKm);
        return result;
    }

    public async Task<MartDetailDto?> GetMartDetailAsync(int martId)
    {
        var supplier = await _context.Suppliers
            .Include(s => s.Products)
            .Where(s => s.Id == martId
                     && s.IsActive == true
                     && s.IsVerified == true
                     && s.IsDeleted != true)
            .FirstOrDefaultAsync();

        if (supplier == null) return null;

        return new MartDetailDto
        {
            Id = supplier.Id,
            StoreName = supplier.StoreName,
            StoreLogoUrl = supplier.StoreLogoUrl,
            StoreBannerUrl = supplier.StoreBannerUrl,
            Rating = supplier.Rating,
            ProductCount = supplier.Products.Count(p => p.IsActive == true && p.IsDeleted != true && p.ApprovalStatus == "approved"),
            TotalOrders = supplier.TotalOrders,
            CompletedOrders = supplier.CompletedOrders,
            SlaComplianceRate = supplier.SlaComplianceRate,
            Address = supplier.Address,
            AddressStreet = supplier.AddressStreet,
            AddressWard = supplier.AddressWard,
            AddressDistrict = supplier.AddressDistrict,
            AddressCity = supplier.AddressCity,
            Certifications = supplier.Certifications,
            OperatingHours = supplier.OperatingHours,
            Features = supplier.Features,
            ServiceAreas = supplier.ServiceAreas,
            MinOrderValue = supplier.MinOrderValue,
            Latitude = supplier.Latitude,
            Longitude = supplier.Longitude
        };
    }

    public async Task<(List<MartProductDto> Products, int TotalCount)> GetMartProductsAsync(int martId, MartProductFilterDto filter)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Where(p => p.SupplierId == martId
                     && p.IsActive == true
                     && p.IsDeleted != true
                     && p.ApprovalStatus == "approved");

        // Category filter
        if (filter.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);

        // Search filter
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = $"%{filter.Search}%";
            query = query.Where(p => EF.Functions.ILike(p.Name, searchTerm)
                                  || (p.Manufacturer != null && EF.Functions.ILike(p.Manufacturer, searchTerm))
                                  || (p.Origin != null && EF.Functions.ILike(p.Origin, searchTerm)));
        }

        var totalCount = await query.CountAsync();

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.BasePrice),
            "price_desc" => query.OrderByDescending(p => p.BasePrice),
            "rating" => query.OrderByDescending(p => p.RatingAverage ?? 0),
            "popular" => query.OrderByDescending(p => p.RatingCount ?? 0),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var products = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => new MartProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
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
                IsSubscriptionAvailable = p.IsSubscriptionAvailable,
                SubscriptionDiscounts = p.SubscriptionDiscounts,
                RatingAverage = p.RatingAverage,
                RatingCount = p.RatingCount,
                CategoryName = p.Category != null ? p.Category.Name : null,
                CategoryId = p.CategoryId
            })
            .ToListAsync();

        return (products, totalCount);
    }

    public async Task<bool> SetSelectedMartAsync(Guid userId, int martId)
    {
        // Verify mart exists and is active
        var martExists = await _context.Suppliers
            .AnyAsync(s => s.Id == martId
                        && s.IsActive == true
                        && s.IsVerified == true
                        && s.IsDeleted != true);

        if (!martExists)
        {
            _logger.LogWarning("Mart {MartId} not found or inactive", martId);
            return false;
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found", userId);
            return false;
        }

        user.SelectedMartId = martId;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} selected mart {MartId}", userId, martId);
        return true;
    }

    public async Task<int?> GetSelectedMartIdAsync(Guid userId)
    {
        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.SelectedMartId)
            .FirstOrDefaultAsync();

        return user;
    }

    /// <summary>
    /// Calculates the great-circle distance between two points using the Haversine formula.
    /// </summary>
    private static double CalculateHaversineDistance(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLng = DegreesToRadians(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2))
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
}
