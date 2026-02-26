using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Suppliers;

namespace FoodCare.API.Controllers.Admin;

[ApiController]
[Route("api/admin/approvals")]
[Authorize(Roles = "admin")]
public class AdminApprovalsController : ControllerBase
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<AdminApprovalsController> _logger;

    public AdminApprovalsController(FoodCareDbContext context, ILogger<AdminApprovalsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ===== PRODUCT APPROVALS =====

    /// <summary>
    /// Get all products pending approval (or filter by status)
    /// </summary>
    [HttpGet("products")]
    public async Task<ActionResult<IEnumerable<PendingProductDto>>> GetPendingProducts(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Where(p => p.IsDeleted != true);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(p => p.ApprovalStatus == status);
        }
        else
        {
            // Default: show pending
            query = query.Where(p => p.ApprovalStatus == "pending");
        }

        var totalItems = await query.CountAsync();

        var products = await query
            .OrderByDescending(p => p.SubmittedAt ?? p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PendingProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                BasePrice = p.BasePrice,
                Sku = p.Sku,
                ImageUrl = p.Images,
                CategoryName = p.Category != null ? p.Category.Name : null,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier != null ? p.Supplier.StoreName : null,
                ApprovalStatus = p.ApprovalStatus ?? "pending",
                ApprovalNotes = p.ApprovalNotes,
                SubmittedAt = p.SubmittedAt,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            items = products,
            totalItems,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    /// <summary>
    /// Approve or reject a product
    /// </summary>
    [HttpPut("products/{productId}")]
    public async Task<ActionResult> ApproveOrRejectProduct(Guid productId, [FromBody] AdminApproveProductDto dto)
    {
        var adminUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminUserId))
            return Unauthorized();

        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            return NotFound(new { message = "Product not found" });

        if (dto.Action.ToLower() == "approve")
        {
            product.ApprovalStatus = "approved";
            product.ApprovedAt = DateTime.UtcNow;
            product.ApprovedBy = Guid.Parse(adminUserId);
            product.ApprovalNotes = dto.Notes;
            product.IsActive = true; // Auto-activate on approval
            product.RejectedAt = null;

            _logger.LogInformation("Product {ProductId} approved by admin {AdminId}", productId, adminUserId);
        }
        else if (dto.Action.ToLower() == "reject")
        {
            product.ApprovalStatus = "rejected";
            product.RejectedAt = DateTime.UtcNow;
            product.ApprovalNotes = dto.Notes;
            product.IsActive = false;
            product.ApprovedAt = null;
            product.ApprovedBy = null;

            _logger.LogInformation("Product {ProductId} rejected by admin {AdminId}", productId, adminUserId);
        }
        else
        {
            return BadRequest(new { message = "Action must be 'approve' or 'reject'" });
        }

        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Product {dto.Action}d successfully", productId, status = product.ApprovalStatus });
    }

    // ===== SUPPLIER REGISTRATION APPROVALS =====

    /// <summary>
    /// Get all suppliers pending registration approval (or filter by status)
    /// </summary>
    [HttpGet("suppliers")]
    public async Task<ActionResult<IEnumerable<PendingSupplierDto>>> GetPendingSuppliers(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Suppliers
            .Where(s => s.IsDeleted != true);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(s => s.RegistrationStatus == status);
        }
        else
        {
            // Default: show pending
            query = query.Where(s => s.RegistrationStatus == "pending" && s.SubmittedAt != null);
        }

        var totalItems = await query.CountAsync();

        var suppliers = await query
            .OrderByDescending(s => s.SubmittedAt ?? s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new PendingSupplierDto
            {
                Id = s.Id,
                StoreName = s.StoreName,
                BusinessName = s.BusinessName,
                BusinessLicense = s.BusinessLicense,
                BusinessLicenseUrl = s.BusinessLicenseUrl,
                TaxCode = s.TaxCode,
                OperatingRegion = s.OperatingRegion,
                ContactName = s.ContactName,
                ContactEmail = s.ContactEmail,
                ContactPhone = s.ContactPhone,
                AddressCity = s.AddressCity,
                RegistrationStatus = s.RegistrationStatus ?? "pending",
                RejectionReason = s.RejectionReason,
                RegistrationNotes = s.RegistrationNotes,
                SubmittedAt = s.SubmittedAt,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            items = suppliers,
            totalItems,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    /// <summary>
    /// Approve or reject a supplier registration
    /// </summary>
    [HttpPut("suppliers/{supplierId}")]
    public async Task<ActionResult> ApproveOrRejectSupplier(int supplierId, [FromBody] AdminApproveSupplierDto dto)
    {
        var adminUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminUserId))
            return Unauthorized();

        var supplier = await _context.Suppliers.FindAsync(supplierId);
        if (supplier == null)
            return NotFound(new { message = "Supplier not found" });

        if (dto.Action.ToLower() == "approve")
        {
            supplier.RegistrationStatus = "approved";
            supplier.ApprovedAt = DateTime.UtcNow;
            supplier.ApprovedBy = Guid.Parse(adminUserId);
            supplier.IsVerified = true;
            supplier.VerifiedAt = DateTime.UtcNow;
            supplier.RejectionReason = null;

            _logger.LogInformation("Supplier {SupplierId} registration approved by admin {AdminId}", supplierId, adminUserId);
        }
        else if (dto.Action.ToLower() == "reject")
        {
            supplier.RegistrationStatus = "rejected";
            supplier.RejectionReason = dto.Reason;
            supplier.IsVerified = false;
            supplier.ApprovedAt = null;
            supplier.ApprovedBy = null;

            _logger.LogInformation("Supplier {SupplierId} registration rejected by admin {AdminId}", supplierId, adminUserId);
        }
        else
        {
            return BadRequest(new { message = "Action must be 'approve' or 'reject'" });
        }

        supplier.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Supplier registration {dto.Action}d successfully", supplierId, status = supplier.RegistrationStatus });
    }

    // ===== STATS =====

    /// <summary>
    /// Get approval statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult> GetApprovalStats()
    {
        var productStats = new
        {
            pending = await _context.Products.CountAsync(p => p.ApprovalStatus == "pending" && p.IsDeleted != true),
            approved = await _context.Products.CountAsync(p => p.ApprovalStatus == "approved" && p.IsDeleted != true),
            rejected = await _context.Products.CountAsync(p => p.ApprovalStatus == "rejected" && p.IsDeleted != true)
        };

        var supplierStats = new
        {
            pending = await _context.Suppliers.CountAsync(s => s.RegistrationStatus == "pending" && s.IsDeleted != true && s.SubmittedAt != null),
            approved = await _context.Suppliers.CountAsync(s => s.RegistrationStatus == "approved" && s.IsDeleted != true),
            rejected = await _context.Suppliers.CountAsync(s => s.RegistrationStatus == "rejected" && s.IsDeleted != true)
        };

        return Ok(new { products = productStats, suppliers = supplierStats });
    }
}
