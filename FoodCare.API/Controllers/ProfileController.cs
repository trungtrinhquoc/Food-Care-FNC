using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs.Profile;
using FoodCare.API.Services.Interfaces;
using System.Security.Claims;

namespace FoodCare.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly ILogger<ProfileController> _logger;

    public ProfileController(IProfileService profileService, ILogger<ProfileController> logger)
    {
        _profileService = profileService;
        _logger = logger;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid token");
        }
        return userId;
    }

    #region Profile Management

    /// <summary>
    /// Update user profile information
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var userId = GetUserId();
            var result = await _profileService.UpdateProfileAsync(userId, request);
            return Ok(new { message = "Profile updated successfully", success = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile");
            return StatusCode(500, new { message = "An error occurred while updating profile" });
        }
    }

    /// <summary>
    /// Change user password
    /// </summary>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = GetUserId();
            var result = await _profileService.ChangePasswordAsync(userId, request);
            return Ok(new { message = "Password changed successfully", success = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return StatusCode(500, new { message = "An error occurred while changing password" });
        }
    }

    #endregion

    #region Address Management

    /// <summary>
    /// Get all addresses for current user
    /// </summary>
    [HttpGet("addresses")]
    public async Task<ActionResult<List<AddressResponse>>> GetAddresses()
    {
        try
        {
            var userId = GetUserId();
            var addresses = await _profileService.GetAddressesAsync(userId);
            return Ok(addresses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting addresses");
            return StatusCode(500, new { message = "An error occurred while getting addresses" });
        }
    }

    /// <summary>
    /// Get specific address by ID
    /// </summary>
    [HttpGet("addresses/{addressId}")]
    public async Task<ActionResult<AddressResponse>> GetAddress(Guid addressId)
    {
        try
        {
            var userId = GetUserId();
            var address = await _profileService.GetAddressByIdAsync(userId, addressId);
            return Ok(address);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting address");
            return StatusCode(500, new { message = "An error occurred while getting address" });
        }
    }

    /// <summary>
    /// Create new address
    /// </summary>
    [HttpPost("addresses")]
    public async Task<ActionResult<AddressResponse>> CreateAddress([FromBody] AddressRequest request)
    {
        try
        {
            var userId = GetUserId();
            var address = await _profileService.CreateAddressAsync(userId, request);
            return CreatedAtAction(nameof(GetAddress), new { addressId = address.Id }, address);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating address");
            return StatusCode(500, new { message = "An error occurred while creating address" });
        }
    }

    /// <summary>
    /// Update existing address
    /// </summary>
    [HttpPut("addresses/{addressId}")]
    public async Task<ActionResult<AddressResponse>> UpdateAddress(Guid addressId, [FromBody] AddressRequest request)
    {
        try
        {
            var userId = GetUserId();
            var address = await _profileService.UpdateAddressAsync(userId, addressId, request);
            return Ok(address);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating address");
            return StatusCode(500, new { message = "An error occurred while updating address" });
        }
    }

    /// <summary>
    /// Delete address
    /// </summary>
    [HttpDelete("addresses/{addressId}")]
    public async Task<IActionResult> DeleteAddress(Guid addressId)
    {
        try
        {
            var userId = GetUserId();
            var result = await _profileService.DeleteAddressAsync(userId, addressId);
            return Ok(new { message = "Address deleted successfully", success = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting address");
            return StatusCode(500, new { message = "An error occurred while deleting address" });
        }
    }

    /// <summary>
    /// Set address as default
    /// </summary>
    [HttpPatch("addresses/{addressId}/set-default")]
    public async Task<IActionResult> SetDefaultAddress(Guid addressId)
    {
        try
        {
            var userId = GetUserId();
            var result = await _profileService.SetDefaultAddressAsync(userId, addressId);
            return Ok(new { message = "Default address updated successfully", success = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default address");
            return StatusCode(500, new { message = "An error occurred while setting default address" });
        }
    }

    #endregion

    #region Payment Method Management

    /// <summary>
    /// Get all payment methods for current user
    /// </summary>
    [HttpGet("payment-methods")]
    public async Task<ActionResult<List<PaymentMethodResponse>>> GetPaymentMethods()
    {
        try
        {
            var userId = GetUserId();
            var paymentMethods = await _profileService.GetPaymentMethodsAsync(userId);
            return Ok(paymentMethods);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment methods");
            return StatusCode(500, new { message = "An error occurred while getting payment methods" });
        }
    }

    /// <summary>
    /// Get specific payment method by ID
    /// </summary>
    [HttpGet("payment-methods/{paymentMethodId}")]
    public async Task<ActionResult<PaymentMethodResponse>> GetPaymentMethod(Guid paymentMethodId)
    {
        try
        {
            var userId = GetUserId();
            var paymentMethod = await _profileService.GetPaymentMethodByIdAsync(userId, paymentMethodId);
            return Ok(paymentMethod);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment method");
            return StatusCode(500, new { message = "An error occurred while getting payment method" });
        }
    }

    /// <summary>
    /// Create new payment method
    /// </summary>
    [HttpPost("payment-methods")]
    public async Task<ActionResult<PaymentMethodResponse>> CreatePaymentMethod([FromBody] PaymentMethodRequest request)
    {
        try
        {
            var userId = GetUserId();
            var paymentMethod = await _profileService.CreatePaymentMethodAsync(userId, request);
            return CreatedAtAction(nameof(GetPaymentMethod), new { paymentMethodId = paymentMethod.Id }, paymentMethod);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment method");
            return StatusCode(500, new { message = "An error occurred while creating payment method" });
        }
    }

    /// <summary>
    /// Update existing payment method
    /// </summary>
    [HttpPut("payment-methods/{paymentMethodId}")]
    public async Task<ActionResult<PaymentMethodResponse>> UpdatePaymentMethod(Guid paymentMethodId, [FromBody] PaymentMethodRequest request)
    {
        try
        {
            var userId = GetUserId();
            var paymentMethod = await _profileService.UpdatePaymentMethodAsync(userId, paymentMethodId, request);
            return Ok(paymentMethod);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating payment method");
            return StatusCode(500, new { message = "An error occurred while updating payment method" });
        }
    }

    /// <summary>
    /// Delete payment method
    /// </summary>
    [HttpDelete("payment-methods/{paymentMethodId}")]
    public async Task<IActionResult> DeletePaymentMethod(Guid paymentMethodId)
    {
        try
        {
            var userId = GetUserId();
            var result = await _profileService.DeletePaymentMethodAsync(userId, paymentMethodId);
            return Ok(new { message = "Payment method deleted successfully", success = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting payment method");
            return StatusCode(500, new { message = "An error occurred while deleting payment method" });
        }
    }

    /// <summary>
    /// Set payment method as default
    /// </summary>
    [HttpPatch("payment-methods/{paymentMethodId}/set-default")]
    public async Task<IActionResult> SetDefaultPaymentMethod(Guid paymentMethodId)
    {
        try
        {
            var userId = GetUserId();
            var result = await _profileService.SetDefaultPaymentMethodAsync(userId, paymentMethodId);
            return Ok(new { message = "Default payment method updated successfully", success = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default payment method");
            return StatusCode(500, new { message = "An error occurred while setting default payment method" });
        }
    }

    #endregion
}
