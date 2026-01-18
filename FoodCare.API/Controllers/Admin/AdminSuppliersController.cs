using FoodCare.API.Models.DTOs.Admin.Suppliers;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/suppliers")]
[Authorize(Roles = "admin")]
public class AdminSuppliersController : ControllerBase
{
    private readonly IAdminSupplierService _supplierService;
    private readonly ILogger<AdminSuppliersController> _logger;

    public AdminSuppliersController(
        IAdminSupplierService supplierService,
        ILogger<AdminSuppliersController> logger)
    {
        _supplierService = supplierService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetSuppliers([FromQuery] AdminSupplierFilterDto filter)
    {
        try
        {
            var result = await _supplierService.GetSuppliersAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving suppliers");
            return StatusCode(500, new { message = "An error occurred while retrieving suppliers" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetSupplierDetail(int id)
    {
        try
        {
            var supplier = await _supplierService.GetSupplierDetailAsync(id);
            if (supplier == null)
            {
                return NotFound(new { message = $"Supplier with ID {id} not found" });
            }

            return Ok(supplier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving supplier {SupplierId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the supplier" });
        }
    }
}
