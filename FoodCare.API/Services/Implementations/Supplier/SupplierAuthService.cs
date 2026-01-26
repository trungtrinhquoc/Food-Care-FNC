using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Suppliers;
using FoodCare.API.Services.Interfaces.Supplier;

namespace FoodCare.API.Services.Implementations.Supplier;

public class SupplierAuthService : ISupplierAuthService
{
    private readonly FoodCareDbContext _context;
    private readonly IMapper _mapper;

    public SupplierAuthService(FoodCareDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<SupplierProfileDto?> GetSupplierProfileAsync(string userId)
    {
        var supplier = await _context.Suppliers
            .Where(s => !s.IsDeleted && s.UserId.Equals(userId))
            .Include(s => s.Products)
            .FirstOrDefaultAsync();

        return supplier != null ? _mapper.Map<SupplierProfileDto>(supplier) : null;
    }

    public async Task<SupplierProfileDto?> UpdateSupplierProfileAsync(string userId, UpdateSupplierDto updateDto)
    {
        var supplier = await _context.Suppliers
            .Where(s => !s.IsDeleted && s.UserId.Equals(userId))
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
        var products = await _context.Products
            .Where(p => (p.IsDeleted == false) && (p.Supplier != null) && p.Supplier.UserId.Equals(userId))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<SupplierProductDto>>(products);
    }

    public async Task<IEnumerable<SupplierOrderDto>> GetSupplierOrdersAsync(string userId)
    {
        var orders = await _context.OrderItems
            .Include(oi => oi.Order)
            .Include(oi => oi.Product)
            .Where(oi => oi.Product != null && 
                         oi.Product.Supplier != null && 
                         oi.Product.Supplier.UserId.Equals(userId))
            .Select(oi => new SupplierOrderDto
            {
                CreatedAt = (DateTime)oi.Order.CreatedAt,
                TotalAmount = oi.Order.TotalAmount,
                Status = oi.Order.Status.ToString(),
                CustomerName = oi.Order.User != null ? oi.Order.User.FullName : "Unknown",
                ItemCount = _context.OrderItems.Count(oi2 => oi2.OrderId == oi.OrderId)
            })
            .Distinct()
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders;
    }

    public async Task<SupplierStatsDto> GetSupplierStatsAsync(string userId)
    {
        var supplier = await _context.Suppliers
            .Where(s => !s.IsDeleted && s.UserId.Equals(userId))
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
                         oi.Product.Supplier.UserId.Equals(userId) &&
                         !oi.Order.Status.Equals("cancelled"))
            .ToListAsync();

        var totalRevenue = orderItems.Sum(oi => oi.TotalPrice);
        var thisMonthRevenue = orderItems
            .Where(oi => oi.Order.CreatedAt >= thisMonth)
            .Sum(oi => oi.TotalPrice);
        var lastMonthRevenue = orderItems
            .Where(oi => oi.Order.CreatedAt >= lastMonth && oi.Order.CreatedAt < thisMonth)
            .Sum(oi => oi.TotalPrice);

        return new SupplierStatsDto
        {
            TotalProducts = products.Count,
            ActiveProducts = products.Count(p => p.IsActive == true),
            LowStockProducts = products.Count(p => p.StockQuantity <= 10),
            TotalOrders = orderItems.Select(oi => oi.OrderId).Distinct().Count(),
            PendingOrders = orderItems.Count(oi => oi.Order.Status.Equals("pending")),
            TotalRevenue = (decimal)totalRevenue,
            ThisMonthRevenue = (decimal)thisMonthRevenue,
            LastMonthRevenue = (decimal)lastMonthRevenue
        };
    }
}
