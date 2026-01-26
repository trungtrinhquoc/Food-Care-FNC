using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Suppliers;
using FoodCare.API.Services.Interfaces.Supplier;

namespace FoodCare.API.Controllers.supplier;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "supplier")]
public class SupplierController : ControllerBase
{
    private readonly ISupplierAuthService _supplierAuthService;

    public SupplierController(ISupplierAuthService supplierAuthService)
    {
        _supplierAuthService = supplierAuthService;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<SupplierProfileDto>> GetProfile()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var profile = await _supplierAuthService.GetSupplierProfileAsync(userId);
        if (profile == null)
            return NotFound("Supplier profile not found");

        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<ActionResult<SupplierProfileDto>> UpdateProfile(UpdateSupplierDto updateDto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var profile = await _supplierAuthService.UpdateSupplierProfileAsync(userId, updateDto);
        if (profile == null)
            return NotFound("Supplier profile not found");

        return Ok(profile);
    }

    [HttpGet("products")]
    public async Task<ActionResult<IEnumerable<SupplierProductDto>>> GetProducts()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var products = await _supplierAuthService.GetSupplierProductsAsync(userId);
        return Ok(products);
    }

    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<SupplierOrderDto>>> GetOrders()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var orders = await _supplierAuthService.GetSupplierOrdersAsync(userId);
        return Ok(orders);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<SupplierStatsDto>> GetStats()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var stats = await _supplierAuthService.GetSupplierStatsAsync(userId);
        return Ok(stats);
    }
}
