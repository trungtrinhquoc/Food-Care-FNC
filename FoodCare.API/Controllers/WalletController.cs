using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FoodCare.API.Models.DTOs;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Controllers;

[ApiController]
[Route("api/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IWalletService _walletService;

    public WalletController(IWalletService walletService)
    {
        _walletService = walletService;
    }

    private Guid GetCurrentUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(raw, out var userId))
            throw new UnauthorizedAccessException("Không xác định được người dùng.");
        return userId;
    }

    /// <summary>GET /api/wallet/balance – Xem số dư ví</summary>
    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        var userId = GetCurrentUserId();
        var balance = await _walletService.GetBalanceAsync(userId);
        return Ok(new WalletBalanceDto { Balance = balance });
    }

    /// <summary>GET /api/wallet/transactions – Lịch sử giao dịch ví</summary>
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var transactions = await _walletService.GetTransactionHistoryAsync(userId, page, pageSize);
        return Ok(transactions);
    }

    /// <summary>
    /// POST /api/wallet/topup – Nạp tiền trực tiếp (dành cho test / admin)
    /// Trong thực tế sẽ được gọi từ Webhook của cổng thanh toán (PayOS/MoMo/VNPay)
    /// </summary>
    [HttpPost("topup")]
    public async Task<IActionResult> TopUp([FromBody] TopUpRequestDto request)
    {
        if (request.Amount <= 0)
            return BadRequest(new { message = "Số tiền nạp phải lớn hơn 0." });
        if (request.Amount > 100_000_000)
            return BadRequest(new { message = "Số tiền nạp vượt quá giới hạn tối đa (100,000,000 VNĐ)." });

        var userId = GetCurrentUserId();
        var tx = await _walletService.TopUpAsync(userId, request.Amount, description: $"Nạp tiền qua cổng thanh toán");
        return Ok(tx);
    }

    /// <summary>POST /api/wallet/deduct – Trừ tiền ví (dùng nội bộ khi thanh toán đơn hàng bằng Ví)</summary>
    [HttpPost("deduct")]
    public async Task<IActionResult> Deduct([FromBody] AdjustBalanceDto request)
    {
        var userId = GetCurrentUserId();

        var hasFunds = await _walletService.HasSufficientBalanceAsync(userId, request.Amount);
        if (!hasFunds)
        {
            var balance = await _walletService.GetBalanceAsync(userId);
            return BadRequest(new
            {
                message = "Số dư tài khoản không đủ.",
                currentBalance = balance,
                required = request.Amount
            });
        }

        var tx = await _walletService.DeductAsync(userId, request.Amount, request.ReferenceId, request.Description);
        return Ok(tx);
    }

    /// <summary>POST /api/wallet/refund – Hoàn tiền vào ví</summary>
    [HttpPost("refund")]
    public async Task<IActionResult> Refund([FromBody] AdjustBalanceDto request)
    {
        var userId = GetCurrentUserId();
        var tx = await _walletService.RefundAsync(userId, request.Amount, request.ReferenceId, request.Description);
        return Ok(tx);
    }

    /// <summary>
    /// POST /api/wallet/pay-order – Thanh toán đơn hàng bằng ví FNC Pay (ATOMIC).
    /// Endpoint này thay thế flow cũ (2 bước: deduct + mark-paid).
    /// Đảm bảo trừ tiền ví + cập nhật order status trong cùng 1 transaction.
    /// </summary>
    [HttpPost("pay-order")]
    public async Task<IActionResult> PayOrderWithWallet([FromBody] WalletPayOrderRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var tx = await _walletService.PayOrderWithWalletAsync(userId, request.OrderId);
            return Ok(new
            {
                message = "Thanh toán thành công bằng FNC Pay.",
                transaction = tx
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }
}
