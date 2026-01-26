using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Suppliers;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet]
    public async Task<ActionResult> GetSuppliers([FromQuery] SupplierFilterDto filter)
    {
        try
        {
            var (suppliers, totalCount) = await _supplierService.GetSuppliersWithPaginationAsync(filter);
            
            return Ok(new
            {
                items = suppliers,
                totalItems = totalCount,
                page = filter.Page,
                pageSize = filter.PageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving suppliers" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SupplierDto>> GetSupplier(int id)
    {
        try
        {
            var supplier = await _supplierService.GetSupplierByIdAsync(id);
            if (supplier == null)
            {
                return NotFound(new { message = $"Supplier with ID {id} not found" });
            }

            return Ok(supplier);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the supplier" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<SupplierDto>> CreateSupplier([FromBody] CreateSupplierDto createDto)
    {
        try
        {
            var supplier = await _supplierService.CreateSupplierAsync(createDto);
            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, supplier);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the supplier" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<SupplierDto>> UpdateSupplier(int id, [FromBody] UpdateSupplierDto updateDto)
    {
        try
        {
            var supplier = await _supplierService.UpdateSupplierAsync(id, updateDto);
            if (supplier == null)
            {
                return NotFound(new { message = $"Supplier with ID {id} not found" });
            }

            return Ok(supplier);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the supplier" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> DeleteSupplier(int id)
    {
        try
        {
            var success = await _supplierService.DeleteSupplierAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Supplier with ID {id} not found" });
            }

            return Ok(new { message = "Supplier deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the supplier" });
        }
    }
}
