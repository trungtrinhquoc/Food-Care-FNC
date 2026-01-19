using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Products;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations;

public class ProductService : IProductService
{
    private readonly FoodCareDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductService> _logger;

    public ProductService(
        FoodCareDbContext context,
        IMapper mapper,
        ILogger<ProductService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(List<ProductDto> Products, int TotalCount)> GetProductsAsync(ProductFilterDto filter)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive == true);

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            query = query.Where(p => p.Name.Contains(filter.SearchTerm) || 
                                    (p.Description != null && p.Description.Contains(filter.SearchTerm)));
        }

        if (filter.MinPrice.HasValue)
        {
            query = query.Where(p => p.BasePrice >= filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(p => p.BasePrice <= filter.MaxPrice.Value);
        }

        if (filter.IsSubscriptionAvailable.HasValue)
        {
            query = query.Where(p => p.IsSubscriptionAvailable == filter.IsSubscriptionAvailable.Value);
        }

        var totalCount = await query.CountAsync();

        query = filter.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.BasePrice),
            "price_desc" => query.OrderByDescending(p => p.BasePrice),
            "name" => query.OrderBy(p => p.Name),
            "rating" => query.OrderByDescending(p => p.RatingAverage),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var products = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var productDtos = _mapper.Map<List<ProductDto>>(products);

        return (productDtos, totalCount);
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        return product == null ? null : _mapper.Map<ProductDto>(product);
    }

    //public async Task<ProductDto> CreateProductAsync(CreateProductDto dto)
    //{
    //    var product = _mapper.Map<Product>(dto);
    //    product.Id = Guid.NewGuid();

    //    _context.Products.Add(product);
    //    await _context.SaveChangesAsync();

    //    await _context.Entry(product).Reference(p => p.Category).LoadAsync();

    //    _logger.LogInformation("Product created: {ProductId} - {ProductName}", product.Id, product.Name);

    //    return _mapper.Map<ProductDto>(product);
    //}

    //public async Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductDto dto)
    //{
    //    var product = await _context.Products.FindAsync(id);
    //    if (product == null)
    //    {
    //        return null;
    //    }

    //    _mapper.Map(dto, product);
    //    product.UpdatedAt = DateTime.UtcNow;

    //    await _context.SaveChangesAsync();
    //    await _context.Entry(product).Reference(p => p.Category).LoadAsync();

    //    _logger.LogInformation("Product updated: {ProductId}", id);

    //    return _mapper.Map<ProductDto>(product);
    //}

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return false;
        }

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product soft deleted: {ProductId}", id);

        return true;
    }
}
