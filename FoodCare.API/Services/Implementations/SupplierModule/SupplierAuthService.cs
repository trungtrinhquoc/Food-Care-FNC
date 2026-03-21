using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Suppliers;
using FoodCare.API.Models.Enums;
using FoodCare.API.Models.Suppliers;
using FoodCare.API.Services.Interfaces;
using FoodCare.API.Services.Interfaces.SupplierModule;
using System.Text.Json;

namespace FoodCare.API.Services.Implementations.SupplierModule;

public class SupplierAuthService : ISupplierAuthService
{
    private readonly FoodCareDbContext _context;
    private readonly IMapper _mapper;
    private readonly IGeocodingService _geocodingService;

    public SupplierAuthService(FoodCareDbContext context, IMapper mapper, IGeocodingService geocodingService)
    {
        _context = context;
        _mapper = mapper;
        _geocodingService = geocodingService;
    }

    public async Task<SupplierProfileDto?> GetSupplierProfileAsync(string userId)
    {
        var userGuid = Guid.Parse(userId);
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.UserId == userGuid)
            .Include(s => s.Products)
            .FirstOrDefaultAsync();

        return supplier != null ? _mapper.Map<SupplierProfileDto>(supplier) : null;
    }

    public async Task<SupplierProfileDto?> UpdateSupplierProfileAsync(string userId, UpdateSupplierDto updateDto)
    {
        var userGuid = Guid.Parse(userId);
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.UserId == userGuid)
            .FirstOrDefaultAsync();

        if (supplier == null)
            return null;

        _mapper.Map(updateDto, supplier);
        supplier.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<SupplierProfileDto>(supplier);
    }

    public async Task<IEnumerable<SupplierProductDto>> GetSupplierProductsAsync(string userId)
    {
        var userGuid = Guid.Parse(userId);
        var products = await _context.Products
            .Where(p => (p.IsDeleted == false) && (p.Supplier != null) && p.Supplier.UserId == userGuid)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<SupplierProductDto>>(products);
    }

    public async Task<IEnumerable<SupplierOrderDto>> GetSupplierOrdersAsync(string userId)
    {
        var userGuid = Guid.Parse(userId);
        var orders = await _context.OrderItems
            .Include(oi => oi.Order)
            .Include(oi => oi.Product)
            .Where(oi => oi.Product != null && 
                         oi.Product.Supplier != null && 
                         oi.Product.Supplier.UserId == userGuid)
            .Select(oi => new SupplierOrderDto
            {
                CreatedAt = oi.Order!.CreatedAt ?? DateTime.UtcNow,
                TotalAmount = oi.Order!.TotalAmount,
                Status = oi.Order!.Status.ToString(),
                CustomerName = oi.Order!.User != null ? (oi.Order!.User.FullName ?? "Unknown") : "Unknown",
                ItemCount = _context.OrderItems.Count(oi2 => oi2.OrderId == oi.OrderId)
            })
            .Distinct()
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders;
    }

    public async Task<SupplierStatsDto> GetSupplierStatsAsync(string userId)
    {
        var userGuid = Guid.Parse(userId);
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.UserId == userGuid)
            .Include(s => s.Products)
            .FirstOrDefaultAsync();

        if (supplier == null)
            return new SupplierStatsDto();

        var products = supplier.Products.Where(p => p.IsDeleted == false).ToList();
        var now = DateTime.UtcNow;
        var thisMonth = new DateTime(now.Year, now.Month, 1);
        var lastMonth = thisMonth.AddMonths(-1);

        var orderItems = await _context.OrderItems
            .Include(oi => oi.Order)
            .Include(oi => oi.Product)
            .Where(oi => oi.Product != null && 
                         oi.Product.Supplier != null && 
                         oi.Product.Supplier.UserId == userGuid &&
                         !oi.Order!.Status.Equals("cancelled"))
            .ToListAsync();

        var totalRevenue = orderItems.Sum(oi => oi.TotalPrice);
        var thisMonthRevenue = orderItems
            .Where(oi => oi.Order!.CreatedAt >= thisMonth)
            .Sum(oi => oi.TotalPrice);
        var lastMonthRevenue = orderItems
            .Where(oi => oi.Order!.CreatedAt >= lastMonth && oi.Order!.CreatedAt < thisMonth)
            .Sum(oi => oi.TotalPrice);

        return new SupplierStatsDto
        {
            TotalProducts = products.Count,
            ActiveProducts = products.Count(p => p.IsActive == true),
            LowStockProducts = products.Count(p => p.StockQuantity <= 10),
            TotalOrders = orderItems.Select(oi => oi.OrderId).Distinct().Count(),
            PendingOrders = orderItems.Count(oi => oi.Order!.Status.Equals("pending")),
            TotalRevenue = totalRevenue ?? 0m,
            ThisMonthRevenue = thisMonthRevenue ?? 0m,
            LastMonthRevenue = lastMonthRevenue ?? 0m
        };
    }

    // Revenue APIs
    public async Task<RevenueDataDto> GetRevenueDataAsync(string userId, int? months = 6)
    {
        var userGuid = Guid.Parse(userId);
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.UserId == userGuid)
            .FirstOrDefaultAsync();

        if (supplier == null)
            return new RevenueDataDto();

        var now = DateTime.UtcNow;
        var startDate = now.AddMonths(-(months ?? 6));

        var orderItems = await _context.OrderItems
            .Include(oi => oi.Order)
            .Include(oi => oi.Product)
            .ThenInclude(p => p!.Category)
            .Where(oi => oi.Product != null && 
                         oi.Product.Supplier != null && 
                         oi.Product.Supplier.UserId == userGuid &&
                         !oi.Order!.Status.Equals("cancelled") &&
                         oi.Order!.CreatedAt >= startDate)
            .ToListAsync();

        // Daily revenue (last 30 days)
        var dailyRevenue = orderItems
            .Where(oi => oi.Order!.CreatedAt >= now.AddDays(-30))
            .GroupBy(oi => oi.Order!.CreatedAt!.Value.Date)
            .Select(g => new DailyRevenueDto
            {
                Date = g.Key,
                Revenue = (decimal)g.Sum(oi => oi.TotalPrice),
                Orders = g.Select(oi => oi.OrderId).Distinct().Count()
            })
            .OrderBy(d => d.Date)
            .ToList();

        // Monthly revenue
        var monthlyRevenue = orderItems
            .GroupBy(oi => new { oi.Order!.CreatedAt!.Value.Year, oi.Order!.CreatedAt.Value.Month })
            .Select(g => new MonthlyRevenueDto
            {
                Month = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                Revenue = (decimal)g.Sum(oi => oi.TotalPrice),
                Orders = g.Select(oi => oi.OrderId).Distinct().Count(),
                Year = g.Key.Year,
                MonthNumber = g.Key.Month
            })
            .OrderBy(m => m.Year)
            .ThenBy(m => m.MonthNumber)
            .ToList();

        // Category revenue
        var categoryRevenue = orderItems
            .Where(oi => oi.Product?.Category != null)
            .GroupBy(oi => oi.Product!.Category!.Name)
            .Select(g => new CategoryRevenueDto
            {
                Category = g.Key ?? "Unknown",
                Revenue = g.Sum(oi => oi.TotalPrice) ?? 0m,
                Percentage = 0 // Will calculate below
            })
            .ToList();

        var totalCategoryRevenue = categoryRevenue.Sum(c => c.Revenue);
        foreach (var cat in categoryRevenue)
        {
            cat.Percentage = totalCategoryRevenue > 0 
                ? Math.Round((cat.Revenue / totalCategoryRevenue) * 100, 2) 
                : 0;
        }

        // Top products
        var topProducts = orderItems
            .GroupBy(oi => new { oi.ProductId, ProductName = oi.Product!.Name })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId ?? Guid.Empty,
                ProductName = g.Key.ProductName ?? "Unknown",
                Revenue = g.Sum(oi => oi.TotalPrice) ?? 0m,
                Quantity = g.Sum(oi => oi.Quantity)
            })
            .OrderByDescending(p => p.Revenue)
            .Take(10)
            .ToList();

        return new RevenueDataDto
        {
            DailyRevenue = dailyRevenue,
            MonthlyRevenue = monthlyRevenue,
            CategoryRevenue = categoryRevenue,
            TopProducts = topProducts,
            TotalRevenue = orderItems.Sum(oi => oi.TotalPrice) ?? 0m,
            TotalOrders = orderItems.Select(oi => oi.OrderId).Distinct().Count()
        };
    }

    // Reviews APIs
    public async Task<IEnumerable<SupplierReviewDto>> GetSupplierReviewsAsync(string userId)
    {
        var userGuid = Guid.Parse(userId);
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Product)
            .Include(r => r.Order)
            .Where(r => r.Product != null && 
                        r.Product.Supplier != null && 
                        r.Product.Supplier.UserId == userGuid &&
                        r.IsHidden != true)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new SupplierReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId ?? Guid.Empty,
                ProductName = r.Product != null ? r.Product.Name : "Unknown",
                ProductImage = r.Product != null ? r.Product.Images : null,
                CustomerName = r.User != null ? (r.User.FullName ?? "Anonymous") : "Anonymous",
                CustomerAvatar = r.User != null ? r.User.AvatarUrl : null,
                Rating = r.Rating ?? 0,
                Comment = r.Comment ?? "",
                Images = r.Images,
                IsVerifiedPurchase = r.IsVerifiedPurchase ?? false,
                ReplyComment = r.ReplyComment,
                ReplyAt = r.ReplyAt,
                CreatedAt = r.CreatedAt ?? DateTime.UtcNow,
                OrderId = r.OrderId
            })
            .ToListAsync();

        return reviews;
    }

    public async Task<ReviewStatsDto> GetReviewStatsAsync(string userId)
    {
        var userGuid = Guid.Parse(userId);
        var reviews = await _context.Reviews
            .Include(r => r.Product)
            .Where(r => r.Product != null && 
                        r.Product.Supplier != null && 
                        r.Product.Supplier.UserId == userGuid &&
                        r.IsHidden != true)
            .ToListAsync();

        var totalReviews = reviews.Count;
        var averageRating = totalReviews > 0 
            ? Math.Round(reviews.Average(r => r.Rating ?? 0), 1) 
            : 0;

        var ratingDistribution = new Dictionary<int, int>
        {
            { 5, reviews.Count(r => r.Rating == 5) },
            { 4, reviews.Count(r => r.Rating == 4) },
            { 3, reviews.Count(r => r.Rating == 3) },
            { 2, reviews.Count(r => r.Rating == 2) },
            { 1, reviews.Count(r => r.Rating == 1) }
        };

        var pendingReplies = reviews.Count(r => string.IsNullOrEmpty(r.ReplyComment));

        return new ReviewStatsDto
        {
            TotalReviews = totalReviews,
            AverageRating = averageRating,
            RatingDistribution = ratingDistribution,
            PendingReplies = pendingReplies,
            ResponseRate = totalReviews > 0 
                ? Math.Round((double)(totalReviews - pendingReplies) / totalReviews * 100, 1) 
                : 0
        };
    }

    public async Task<bool> RespondToReviewAsync(string userId, Guid reviewId, RespondToReviewDto dto)
    {
        var userGuid = Guid.Parse(userId);
        var review = await _context.Reviews
            .Include(r => r.Product)
            .ThenInclude(p => p!.Supplier)
            .Where(r => r.Id == reviewId && 
                        r.Product != null && 
                        r.Product.Supplier != null && 
                        r.Product.Supplier.UserId == userGuid)
            .FirstOrDefaultAsync();

        if (review == null)
            return false;

        review.ReplyComment = dto.ReplyComment;
        review.ReplyAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    // ===== SUPPLIER PRODUCT CRUD =====

    public async Task<SupplierProductDto?> CreateProductAsync(string userId, CreateSupplierProductDto dto)
    {
        var userGuid = Guid.Parse(userId);
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.UserId == userGuid)
            .FirstOrDefaultAsync();

        if (supplier == null) return null;

        // Check if supplier is approved
        if (supplier.RegistrationStatus != "approved")
            throw new InvalidOperationException("Nhà cung cấp chưa được duyệt đăng ký kinh doanh. Vui lòng hoàn tất đăng ký trước.");

        // Check for duplicate SKU
        if (!string.IsNullOrWhiteSpace(dto.Sku))
        {
            var skuExists = await _context.Products
                .AnyAsync(p => p.Sku == dto.Sku && p.IsDeleted == false);
            if (skuExists)
                throw new InvalidOperationException($"Mã SKU '{dto.Sku}' đã tồn tại. Vui lòng sử dụng mã SKU khác.");
        }

        var slug = dto.Name.ToLower()
            .Replace(" ", "-")
            .Replace("đ", "d")
            .Replace("ă", "a").Replace("â", "a")
            .Replace("ê", "e").Replace("ô", "o").Replace("ơ", "o").Replace("ư", "u");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = $"{slug}-{Guid.NewGuid().ToString()[..8]}";

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Slug = slug,
            Description = dto.Description,
            BasePrice = dto.BasePrice,
            CostPrice = dto.Cost,
            Sku = dto.Sku,
            StockQuantity = dto.StockQuantity,
            LowStockThreshold = dto.MinStock ?? 10,
            CategoryId = dto.CategoryId,
            Images = dto.Images != null && dto.Images.Length > 0 ? JsonSerializer.Serialize(dto.Images) : null,
            SupplierId = supplier.Id,
            IsActive = false, // Not active until approved
            IsDeleted = false,
            ApprovalStatus = "pending",
            SubmittedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return new SupplierProductDto
        {
            Id = product.Id.ToString(),
            Name = product.Name,
            Description = product.Description,
            BasePrice = product.BasePrice,
            Price = product.BasePrice,
            Cost = product.CostPrice,
            StockQuantity = product.StockQuantity ?? 0,
            Sku = product.Sku,
            Image = product.Images,
            Images = ParseImagesJson(product.Images),
            IsActive = product.IsActive ?? false,
            Status = product.ApprovalStatus,
            CreatedAt = product.CreatedAt ?? DateTime.UtcNow,
            UpdatedAt = product.UpdatedAt,
            OrderCount = 0,
            TotalRevenue = 0
        };
    }

    public async Task<SupplierProductDto?> UpdateProductAsync(string userId, Guid productId, UpdateSupplierProductDto dto)
    {
        var userGuid = Guid.Parse(userId);
        var product = await _context.Products
            .Include(p => p.Supplier)
            .Where(p => p.Id == productId && 
                        p.IsDeleted == false &&
                        p.Supplier != null && 
                        p.Supplier.UserId == userGuid)
            .FirstOrDefaultAsync();

        if (product == null) return null;

        if (dto.Name != null) product.Name = dto.Name;
        if (dto.Description != null) product.Description = dto.Description;
        if (dto.BasePrice.HasValue) product.BasePrice = dto.BasePrice.Value;
        if (dto.Cost.HasValue) product.CostPrice = dto.Cost.Value;
        if (dto.StockQuantity.HasValue) product.StockQuantity = dto.StockQuantity.Value;
        if (dto.MinStock.HasValue) product.LowStockThreshold = dto.MinStock.Value;
        if (dto.Sku != null)
        {
            // Check for duplicate SKU (exclude current product)
            var skuExists = await _context.Products
                .AnyAsync(p => p.Sku == dto.Sku && p.Id != productId && p.IsDeleted == false);
            if (skuExists)
                throw new InvalidOperationException($"Mã SKU '{dto.Sku}' đã tồn tại. Vui lòng sử dụng mã SKU khác.");
            product.Sku = dto.Sku;
        }
        if (dto.CategoryId.HasValue) product.CategoryId = dto.CategoryId.Value;
        if (dto.Images != null) product.Images = dto.Images.Length > 0 ? JsonSerializer.Serialize(dto.Images) : null;
        
        product.UpdatedAt = DateTime.UtcNow;

        // If product was rejected, allow re-submission
        if (product.ApprovalStatus == "rejected")
        {
            product.ApprovalStatus = "pending";
            product.SubmittedAt = DateTime.UtcNow;
            product.ApprovalNotes = null;
            product.RejectedAt = null;
        }

        await _context.SaveChangesAsync();

        return new SupplierProductDto
        {
            Id = product.Id.ToString(),
            Name = product.Name,
            Description = product.Description,
            BasePrice = product.BasePrice,
            Price = product.BasePrice,
            Cost = product.CostPrice,
            StockQuantity = product.StockQuantity ?? 0,
            Sku = product.Sku,
            Image = product.Images,
            Images = ParseImagesJson(product.Images),
            IsActive = product.IsActive ?? false,
            Status = product.ApprovalStatus,
            CreatedAt = product.CreatedAt ?? DateTime.UtcNow,
            UpdatedAt = product.UpdatedAt,
            OrderCount = 0,
            TotalRevenue = 0
        };
    }

    public async Task<bool> DeleteProductAsync(string userId, Guid productId)
    {
        var userGuid = Guid.Parse(userId);
        var product = await _context.Products
            .Include(p => p.Supplier)
            .Where(p => p.Id == productId && 
                        p.IsDeleted == false &&
                        p.Supplier != null && 
                        p.Supplier.UserId == userGuid)
            .FirstOrDefaultAsync();

        if (product == null) return false;

        product.IsDeleted = true;
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SubmitProductForApprovalAsync(string userId, Guid productId)
    {
        var userGuid = Guid.Parse(userId);
        var product = await _context.Products
            .Include(p => p.Supplier)
            .Where(p => p.Id == productId && 
                        p.IsDeleted == false &&
                        p.Supplier != null && 
                        p.Supplier.UserId == userGuid)
            .FirstOrDefaultAsync();

        if (product == null) return false;
        
        product.ApprovalStatus = "pending";
        product.SubmittedAt = DateTime.UtcNow;
        product.ApprovalNotes = null;
        product.RejectedAt = null;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    // ===== BUSINESS REGISTRATION =====

    public async Task<SupplierRegistrationDto?> GetRegistrationStatusAsync(string userId)
    {
        var userGuid = Guid.Parse(userId);
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.UserId == userGuid)
            .FirstOrDefaultAsync();

        if (supplier == null) return null;

        return new SupplierRegistrationDto
        {
            SupplierId = supplier.Id,
            StoreName = supplier.StoreName,
            BusinessName = supplier.BusinessName,
            BusinessLicense = supplier.BusinessLicense,
            BusinessLicenseUrl = supplier.BusinessLicenseUrl,
            TaxCode = supplier.TaxCode,
            OperatingRegion = supplier.OperatingRegion,
            ContactName = supplier.ContactName,
            ContactEmail = supplier.ContactEmail,
            ContactPhone = supplier.ContactPhone,
            AddressStreet = supplier.AddressStreet,
            AddressWard = supplier.AddressWard,
            AddressDistrict = supplier.AddressDistrict,
            AddressCity = supplier.AddressCity,
            RegistrationStatus = supplier.RegistrationStatus ?? "pending",
            RejectionReason = supplier.RejectionReason,
            RegistrationNotes = supplier.RegistrationNotes,
            SubmittedAt = supplier.SubmittedAt,
            ApprovedAt = supplier.ApprovedAt,
            IsVerified = supplier.IsVerified ?? false
        };
    }

    public async Task<SupplierRegistrationDto?> SubmitRegistrationAsync(string userId, SubmitRegistrationDto dto)
    {
        var userGuid = Guid.Parse(userId);
        var supplier = await _context.Suppliers
            .Where(s => s.IsDeleted == false && s.UserId == userGuid)
            .FirstOrDefaultAsync();

        if (supplier == null) return null;

        // Validate required fields
        if (string.IsNullOrWhiteSpace(dto.BusinessLicense))
            throw new InvalidOperationException("Giấy phép kinh doanh là bắt buộc.");
        if (string.IsNullOrWhiteSpace(dto.AddressCity))
            throw new InvalidOperationException("Tỉnh/Thành phố là bắt buộc để phân bổ khu vực nhập kho.");
        if (string.IsNullOrWhiteSpace(dto.AddressDistrict))
            throw new InvalidOperationException("Quận/Huyện là bắt buộc để phân bổ khu vực nhập kho.");
        if (string.IsNullOrWhiteSpace(dto.AddressWard))
            throw new InvalidOperationException("Phường/Xã là bắt buộc để phân bổ khu vực nhập kho.");

        // Auto-derive operating region from city if not provided
        if (string.IsNullOrWhiteSpace(dto.OperatingRegion))
            dto.OperatingRegion = DeriveRegionFromCity(dto.AddressCity);

        // Update supplier with registration info
        supplier.BusinessName = dto.BusinessName;
        supplier.BusinessLicense = dto.BusinessLicense;
        supplier.BusinessLicenseUrl = dto.BusinessLicenseUrl;
        supplier.TaxCode = dto.TaxCode;
        supplier.OperatingRegion = dto.OperatingRegion;
        supplier.ContactName = dto.ContactName;
        supplier.ContactPhone = dto.ContactPhone;
        supplier.AddressStreet = dto.AddressStreet;
        supplier.AddressWard = dto.AddressWard;
        supplier.AddressDistrict = dto.AddressDistrict;
        supplier.AddressCity = dto.AddressCity;
        supplier.RegistrationNotes = dto.RegistrationNotes;
        supplier.RegistrationStatus = "pending";
        supplier.RejectionReason = null;
        supplier.SubmittedAt = DateTime.UtcNow;
        supplier.UpdatedAt = DateTime.UtcNow;

        // Auto-geocode supplier address for area-matching
        try
        {
            var (lat, lng) = await _geocodingService.GeocodeAddressAsync(
                dto.AddressWard, dto.AddressDistrict, dto.AddressCity);
            if (lat.HasValue && lng.HasValue)
            {
                supplier.Latitude = lat.Value;
                supplier.Longitude = lng.Value;
            }
        }
        catch { /* Geocoding failure should not block registration */ }

        await _context.SaveChangesAsync();

        return await GetRegistrationStatusAsync(userId);
    }

    // ===== ORDER STATUS UPDATE =====

    public async Task<bool> UpdateOrderStatusAsync(Guid orderId, Guid userId, UpdateOrderStatusDto dto)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == userId && s.IsDeleted != true);
        if (supplier == null) return false;

        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId &&
                o.OrderItems.Any(oi => oi.Product != null && oi.Product.SupplierId == supplier.Id));
        if (order == null) return false;

        if (dto.Status == "delivered" && string.IsNullOrWhiteSpace(dto.DeliveryPhotoUrl))
            throw new InvalidOperationException("Delivery photo is required when marking an order as delivered.");

        order.Status = dto.Status switch
        {
            "confirmed" => OrderStatus.confirmed,
            "shipping"  => OrderStatus.shipping,
            "delivered" => OrderStatus.delivered,
            "cancelled" => OrderStatus.cancelled,
            _ => order.Status
        };

        if (dto.Status == "delivered" && !string.IsNullOrWhiteSpace(dto.DeliveryPhotoUrl))
            order.DeliveryPhotoUrl = dto.DeliveryPhotoUrl;

        order.UpdatedAt = DateTime.UtcNow;

        if (dto.Status == "delivered")
        {
            supplier.CompletedOrders = (supplier.CompletedOrders ?? 0) + 1;
            supplier.TotalRevenue = (supplier.TotalRevenue ?? 0) + order.TotalAmount;
        }
        else if (dto.Status == "cancelled")
        {
            supplier.CancelledOrders = (supplier.CancelledOrders ?? 0) + 1;
        }

        var completed = supplier.CompletedOrders ?? 0;
        var cancelled = supplier.CancelledOrders ?? 0;
        supplier.TotalOrders = completed + cancelled;
        supplier.SlaComplianceRate = supplier.TotalOrders > 0
            ? Math.Round((decimal)completed / supplier.TotalOrders.Value * 100, 2)
            : 100;

        await _context.SaveChangesAsync();
        return true;
    }

    // ===== NEAR-EXPIRY PRODUCTS =====

    public async Task<List<NearExpiryProductDto>> GetNearExpiryProductsAsync(Guid userId, int days = 45)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == userId && s.IsDeleted != true);
        if (supplier == null) return new List<NearExpiryProductDto>();

        var cutoff = DateTime.UtcNow.AddDays(days);
        return await _context.SupplierProducts
            .Where(p => p.SupplierId == supplier.Id
                     && p.ExpiryDate != null
                     && p.ExpiryDate <= cutoff
                     && p.ExpiryDate > DateTime.UtcNow
                     && p.IsActive == true)
            .OrderBy(p => p.ExpiryDate)
            .Select(p => new NearExpiryProductDto
            {
                Id              = p.Id,
                Name            = p.Name,
                StockQuantity   = p.StockQuantity,
                ExpiryDate      = p.ExpiryDate!.Value,
                DaysUntilExpiry = (int)(p.ExpiryDate!.Value - DateTime.UtcNow).TotalDays,
                ImageUrl        = p.ImageUrl,
                BasePrice       = p.BasePrice,
            })
            .ToListAsync();
    }

    // ===== SLA METRICS =====

    public async Task<SupplierSlaDto> GetSlaMetricsAsync(Guid userId)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.UserId == userId && s.IsDeleted != true);
        if (supplier == null) return new SupplierSlaDto();

        var total = supplier.TotalOrders ?? 0;
        var completed = supplier.CompletedOrders ?? 0;
        var successRate = total > 0
            ? Math.Round((decimal)completed / total * 100, 2)
            : 100m;

        return new SupplierSlaDto
        {
            SlaComplianceRate     = supplier.SlaComplianceRate ?? 100m,
            Rating                = supplier.Rating ?? 0m,
            TotalOrders           = total,
            CompletedOrders       = completed,
            CancelledOrders       = supplier.CancelledOrders ?? 0,
            OrderSuccessRate      = successRate,
            LateDeliveryCount     = supplier.LateDeliveryCount ?? 0,
            LateConfirmationCount = supplier.LateConfirmationCount ?? 0,
            QualityScore          = supplier.QualityScore ?? 0m,
            ReturnRate            = supplier.ReturnRate ?? 0m,
            SlaCompliant          = (supplier.SlaComplianceRate ?? 100m) >= 95m,
            RatingOk              = (supplier.Rating ?? 0m) >= 4.0m,
        };
    }

    /// <summary>
    /// Parse Images JSON string (stored as JSON array in PostgreSQL) to string array.
    /// Handles both JSON arrays ["url1","url2"] and legacy comma-separated "url1,url2" formats.
    /// </summary>
    private static string[]? ParseImagesJson(string? images)
    {
        if (string.IsNullOrWhiteSpace(images)) return null;
        try
        {
            return JsonSerializer.Deserialize<string[]>(images);
        }
        catch
        {
            // Fallback: legacy comma-separated format
            return images.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }
    }

    /// <summary>
    /// Auto-derive operating region (North/Central/South) from Vietnamese city name.
    /// </summary>
    private static string DeriveRegionFromCity(string city)
    {
        if (string.IsNullOrWhiteSpace(city)) return "Central";
        var c = city.ToLower();

        var north = new[] { "hà nội", "hải phòng", "bắc ninh", "hưng yên", "hải dương", "quảng ninh",
            "nam định", "ninh bình", "thái bình", "hà nam", "vĩnh phúc", "phú thọ", "thái nguyên",
            "bắc giang", "lạng sơn", "lào cai", "yên bái", "tuyên quang", "hà giang", "cao bằng",
            "bắc kạn", "sơn la", "lai châu", "điện biên", "hòa bình" };

        var central = new[] { "đà nẵng", "thừa thiên huế", "quảng nam", "quảng ngãi", "bình định",
            "phú yên", "khánh hòa", "ninh thuận", "bình thuận", "thanh hóa", "nghệ an", "hà tĩnh",
            "quảng bình", "quảng trị", "kon tum", "gia lai", "đắk lắk", "đắk nông", "lâm đồng" };

        var south = new[] { "hồ chí minh", "bình dương", "đồng nai", "bà rịa", "vũng tàu", "long an",
            "tây ninh", "bình phước", "tiền giang", "bến tre", "vĩnh long", "trà vinh", "cần thơ",
            "sóc trăng", "bạc liêu", "cà mau", "an giang", "kiên giang", "đồng tháp", "hậu giang" };

        if (north.Any(p => c.Contains(p))) return "North";
        if (central.Any(p => c.Contains(p))) return "Central";
        if (south.Any(p => c.Contains(p))) return "South";

        return "Central"; // default
    }
}
