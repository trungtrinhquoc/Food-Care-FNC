using Microsoft.AspNetCore.Mvc;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "healthy", message = "API is running" });
    }
}
