using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Products;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "admin")]
public class AdminProductsController : ControllerBase
{
    private readonly IAdminProductService _productService;
    private readonly ILogger<AdminProductsController> _logger;

    public AdminProductsController(
        IAdminProductService productService,
        ILogger<AdminProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminProductDto>>> GetProducts([FromQuery] AdminProductFilterDto filter)
    {
        try
        {
            var result = await _productService.GetProductsAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, new { message = "An error occurred while retrieving products" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AdminProductDto>> GetProduct(Guid id)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = $"Product with ID {id} not found" });
            }

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the product" });
        }
    }

    [HttpGet("low-stock")]
    public async Task<ActionResult<List<AdminProductDto>>> GetLowStockProducts([FromQuery] int threshold = 10)
    {
        try
        {
            var products = await _productService.GetLowStockProductsAsync(threshold);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving low stock products");
            return StatusCode(500, new { message = "An error occurred while retrieving low stock products" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<AdminProductDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            var product = await _productService.CreateProductAsync(dto);
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, new { message = "An error occurred while creating the product" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AdminProductDto>> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto)
    {
        try
        {
            var product = await _productService.UpdateProductAsync(id, dto);
            return Ok(product);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the product" });
        }
    }

    [HttpPatch("{id}/stock")]
    public async Task<ActionResult> UpdateStock(Guid id, [FromBody] UpdateStockDto dto)
    {
        try
        {
            var success = await _productService.UpdateStockAsync(id, dto.Quantity);
            if (!success)
            {
                return NotFound(new { message = $"Product with ID {id} not found" });
            }

            return Ok(new { message = "Stock updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating stock for product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while updating stock" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProduct(Guid id)
    {
        try
        {
            var success = await _productService.DeleteProductAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Product with ID {id} not found" });
            }

            return Ok(new { message = "Product deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the product" });
        }
    }
}

public record UpdateStockDto(int Quantity);
