using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Products;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetProducts([FromQuery] ProductFilterDto filter)
    {
        try
        {
            var (products, totalCount) = await _productService.GetProductsAsync(filter);
            
            return Ok(new
            {
                products,
                totalCount,
                page = filter.Page,
                pageSize = filter.PageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products");
            return StatusCode(500, new { message = "An error occurred while retrieving products" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [HttpPost]
    //public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto dto)
    //{
    //    try
    //    {
    //        var product = await _productService.CreateProductAsync(dto);
    //        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    //    }
    //    catch (Exception ex)
    //    {
    //        _logger.LogError(ex, "Error creating product");
    //        return StatusCode(500, new { message = "An error occurred while creating the product" });
    //    }
    //}

    [HttpPut("{id}")]
    //public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto)
    //{
    //    try
    //    {
    //        var product = await _productService.UpdateProductAsync(id, dto);
    //        if (product == null)
    //        {
    //            return NotFound(new { message = "Product not found" });
    //        }

    //        return Ok(product);
    //    }
    //    catch (Exception ex)
    //    {
    //        _logger.LogError(ex, "Error updating product {ProductId}", id);
    //        return StatusCode(500, new { message = "An error occurred while updating the product" });
    //    }
    //}

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        try
        {
            var result = await _productService.DeleteProductAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Product not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the product" });
        }
    }
}
