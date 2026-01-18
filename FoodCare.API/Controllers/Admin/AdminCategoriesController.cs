using FoodCare.API.Models.DTOs.Admin;
using FoodCare.API.Models.DTOs.Admin.Categories;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "admin")]
public class AdminCategoriesController : ControllerBase
{
    private readonly IAdminCategoryService _categoryService;
    private readonly ILogger<AdminCategoriesController> _logger;

    public AdminCategoriesController(
        IAdminCategoryService categoryService,
        ILogger<AdminCategoriesController> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminCategoryDto>>> GetCategories(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        try
        {
            _logger.LogInformation("GetCategories called: page={Page}, pageSize={PageSize}, search={Search}", page, pageSize, search);
            var categories = await _categoryService.GetCategoriesAsync(page, pageSize, search);
            _logger.LogInformation("GetCategories returned {Count} items", categories.Items.Count);
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving categories");
            return StatusCode(500, new { message = "An error occurred while retrieving categories" });
        }
    }

    [HttpGet("dropdown")]
    public async Task<ActionResult<List<CategoryDropdownDto>>> GetCategoriesDropdown()
    {
        try
        {
            var categories = await _categoryService.GetCategoriesDropdownAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving categories dropdown");
            return StatusCode(500, new { message = "An error occurred while retrieving categories" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AdminCategoryDto>> GetCategory(int id)
    {
        try
        {
            var category = await _categoryService.GetCategoryByIdAsync(id);
            if (category == null)
            {
                return NotFound(new { message = $"Category with ID {id} not found" });
            }

            return Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving category {CategoryId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the category" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<AdminCategoryDto>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        try
        {
            var category = await _categoryService.CreateCategoryAsync(dto);
            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(500, new { message = "An error occurred while creating the category" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AdminCategoryDto>> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    {
        try
        {
            var category = await _categoryService.UpdateCategoryAsync(id, dto);
            if (category == null)
            {
                return NotFound(new { message = $"Category with ID {id} not found" });
            }

            return Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category {CategoryId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the category" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCategory(int id)
    {
        try
        {
            var success = await _categoryService.DeleteCategoryAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Category with ID {id} not found" });
            }

            return Ok(new { message = "Category deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category {CategoryId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the category" });
        }
    }
}
