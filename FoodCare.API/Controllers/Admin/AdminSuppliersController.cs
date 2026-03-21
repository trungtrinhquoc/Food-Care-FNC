using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Admin.Suppliers;
using FoodCare.API.Models.DTOs.Admin.Users;
using FoodCare.API.Services.Interfaces;
using FoodCare.API.Services.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodCare.API.Controllers.Admin;

// Inline DTOs for new actions
public class SuspendSupplierDto
{
    public string Reason { get; set; } = string.Empty;
}

public class UpdateCommissionDto
{
    public decimal CommissionRate { get; set; }
}

[ApiController]
[Route("api/admin/suppliers")]
[Authorize(Roles = "admin")]
public class AdminSuppliersController : ControllerBase
{
    private readonly IAdminSupplierService _supplierService;
    private readonly ILogger<AdminSuppliersController> _logger;
    private readonly FoodCareDbContext _context;
    private readonly IAdminUserService _adminUserService;
    private readonly IEmailService _emailService;

    public AdminSuppliersController(
        IAdminSupplierService supplierService,
        ILogger<AdminSuppliersController> logger,
        FoodCareDbContext context,
        IAdminUserService adminUserService,
        IEmailService emailService)
    {
        _supplierService = supplierService;
        _logger = logger;
        _context = context;
        _adminUserService = adminUserService;
        _emailService = emailService;
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

    [HttpPost]
    public async Task<ActionResult> CreateSupplier([FromBody] AdminUpsertSupplierDto dto)
    {
        try
        {
            // Create supplier user account if credentials are provided
            if (!string.IsNullOrWhiteSpace(dto.AccountEmail) && !string.IsNullOrWhiteSpace(dto.AccountPassword))
            {
                var newUser = await _adminUserService.CreateUserAsync(new CreateUserDto
                {
                    Email = dto.AccountEmail,
                    Password = dto.AccountPassword,
                    FullName = dto.Name,
                    Role = "supplier"
                });

                // Set email verification token
                var verificationToken = Guid.NewGuid().ToString("N");
                var user = await _context.Users.FindAsync(newUser.Id);
                if (user != null)
                {
                    user.EmailVerificationToken = verificationToken;
                    user.EmailVerificationExpiry = DateTime.UtcNow.AddHours(24);
                    await _context.SaveChangesAsync();
                }

                // Send verification email (non-blocking — failures are logged internally)
                _ = _emailService.SendVerificationEmailAsync(dto.AccountEmail, verificationToken, dto.Name);

                dto.UserId = newUser.Id;
            }

            var supplier = await _supplierService.CreateSupplierAsync(dto);
            return CreatedAtAction(nameof(GetSupplierDetail), new { id = supplier.Id }, supplier);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Email đã tồn tại"))
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating supplier");
            return StatusCode(500, new { message = "An error occurred while creating the supplier" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateSupplier(int id, [FromBody] AdminUpsertSupplierDto dto)
    {
        try
        {
            var supplier = await _supplierService.UpdateSupplierAsync(id, dto);
            if (supplier == null)
            {
                return NotFound(new { message = $"Supplier with ID {id} not found" });
            }

            return Ok(supplier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating supplier {SupplierId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the supplier" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSupplier(int id)
    {
        try
        {
            var result = await _supplierService.DeleteSupplierAsync(id);
            if (!result)
            {
                return NotFound(new { message = $"Supplier with ID {id} not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting supplier {SupplierId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the supplier" });
        }
    }

    [HttpGet("mart-list")]
    public async Task<ActionResult> GetMartList()
    {
        try
        {
            var result = await _supplierService.GetMartListAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving mart list");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách mart" });
        }
    }

    // PATCH /api/admin/suppliers/{id}/suspend
    [HttpPatch("{id}/suspend")]
    public async Task<ActionResult> SuspendSupplier(int id, [FromBody] SuspendSupplierDto dto)
    {
        try
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return NotFound(new { message = $"Supplier with ID {id} not found" });

            supplier.IsActive = false;
            supplier.SuspensionReason = dto.Reason;
            supplier.SuspendedAt = DateTime.UtcNow;
            supplier.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Mart đã được tạm ngừng thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error suspending supplier {SupplierId}", id);
            return StatusCode(500, new { message = "Lỗi khi tạm ngừng mart" });
        }
    }

    // PATCH /api/admin/suppliers/{id}/unsuspend
    [HttpPatch("{id}/unsuspend")]
    public async Task<ActionResult> UnsuspendSupplier(int id)
    {
        try
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return NotFound(new { message = $"Supplier with ID {id} not found" });

            supplier.IsActive = true;
            supplier.SuspensionReason = null;
            supplier.SuspendedAt = null;
            supplier.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Mart đã được kích hoạt lại thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unsuspending supplier {SupplierId}", id);
            return StatusCode(500, new { message = "Lỗi khi kích hoạt lại mart" });
        }
    }

    // PATCH /api/admin/suppliers/{id}/commission
    [HttpPatch("{id}/commission")]
    public async Task<ActionResult> UpdateCommission(int id, [FromBody] UpdateCommissionDto dto)
    {
        try
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return NotFound(new { message = $"Supplier with ID {id} not found" });

            supplier.CommissionRate = dto.CommissionRate;
            supplier.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Tỷ lệ hoa hồng đã được cập nhật thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating commission for supplier {SupplierId}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật tỷ lệ hoa hồng" });
        }
    }
}
