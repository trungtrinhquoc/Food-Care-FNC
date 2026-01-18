using FoodCare.API.Models.DTOs.Admin.Customers;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/customers")]
[Authorize(Roles = "admin")]
public class AdminCustomersController : ControllerBase
{
    private readonly IAdminCustomerService _customerService;
    private readonly ILogger<AdminCustomersController> _logger;

    public AdminCustomersController(
        IAdminCustomerService customerService,
        ILogger<AdminCustomersController> logger)
    {
        _customerService = customerService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetCustomers([FromQuery] AdminCustomerFilterDto filter)
    {
        try
        {
            var result = await _customerService.GetCustomersAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customers");
            return StatusCode(500, new { message = "An error occurred while retrieving customers" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetCustomerDetail(Guid id)
    {
        try
        {
            var customer = await _customerService.GetCustomerDetailAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = $"Customer with ID {id} not found" });
            }

            return Ok(customer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customer {CustomerId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the customer" });
        }
    }
}
