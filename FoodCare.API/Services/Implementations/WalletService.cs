using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations;

public class WalletService : IWalletService
{
    private readonly FoodCareDbContext _db;
    private readonly ILogger<WalletService> _logger;

    public WalletService(FoodCareDbContext db, ILogger<WalletService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<decimal> GetBalanceAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản người dùng.");
        return user.AccountBalance;
    }

    public async Task<List<WalletTransactionDto>> GetTransactionHistoryAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        return await _db.WalletTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new WalletTransactionDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = t.Type.ToString(),
                Status = t.Status.ToString(),
                ReferenceId = t.ReferenceId,
                Description = t.Description,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<WalletTransactionDto> TopUpAsync(Guid userId, decimal amount, Guid? referenceId = null, string? description = null)
    {
        if (amount <= 0)
            throw new ArgumentException("Số tiền nạp phải lớn hơn 0.");

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy tài khoản người dùng.");

            // Cộng tiền vào ví
            user.AccountBalance += amount;

            // Ghi lịch sử giao dịch
            var transaction = new WalletTransaction
            {
                UserId = userId,
                Amount = amount,
                Type = WalletTransactionType.TopUp,
                Status = WalletTransactionStatus.Completed,
                ReferenceId = referenceId,
                Description = description ?? $"Nạp tiền vào ví: {amount:N0} VNĐ"
            };

            _db.WalletTransactions.Add(transaction);
            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            _logger.LogInformation("[WalletService] ✅ TopUp thành công - UserId: {UserId}, Amount: {Amount}", userId, amount);
            return MapToDto(transaction);
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    public async Task<WalletTransactionDto> DeductAsync(Guid userId, decimal amount, Guid? referenceId = null, string? description = null)
    {
        if (amount <= 0)
            throw new ArgumentException("Số tiền trừ phải lớn hơn 0.");

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy tài khoản người dùng.");

            if (user.AccountBalance < amount)
                throw new InvalidOperationException($"Số dư không đủ. Số dư hiện tại: {user.AccountBalance:N0} VNĐ. Cần: {amount:N0} VNĐ.");

            // Trừ tiền từ ví
            user.AccountBalance -= amount;

            var transaction = new WalletTransaction
            {
                UserId = userId,
                Amount = amount,
                Type = WalletTransactionType.Payment,
                Status = WalletTransactionStatus.Completed,
                ReferenceId = referenceId,
                Description = description ?? $"Thanh toán đơn hàng: {amount:N0} VNĐ"
            };

            _db.WalletTransactions.Add(transaction);
            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            _logger.LogInformation("[WalletService] ✅ Deduct thành công - UserId: {UserId}, Amount: {Amount}", userId, amount);
            return MapToDto(transaction);
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// ATOMIC: Thanh toán đơn hàng bằng ví FNC Pay.
    /// Tất cả các bước (trừ tiền, tạo transaction, cập nhật order) đều nằm trong 1 database transaction.
    /// Nếu bất kỳ bước nào fail → rollback toàn bộ → dữ liệu luôn consistent.
    /// </summary>
    public async Task<WalletTransactionDto> PayOrderWithWalletAsync(Guid userId, Guid orderId)
    {
        _logger.LogInformation("[WalletService] START PayOrderWithWalletAsync - UserId: {UserId}, OrderId: {OrderId}", userId, orderId);

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // 1. Load user
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy tài khoản người dùng.");

            // 2. Load order + validate
            var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng: {orderId}");

            if (order.UserId != userId)
                throw new UnauthorizedAccessException("Đơn hàng không thuộc về người dùng này.");

            if (order.PaymentStatus == PaymentStatus.paid)
                throw new InvalidOperationException("Đơn hàng đã được thanh toán trước đó.");

            var amount = order.TotalAmount;

            // 3. Check balance
            if (user.AccountBalance < amount)
            {
                _logger.LogWarning("[WalletService] ❌ Số dư không đủ - Balance: {Balance}, Required: {Required}",
                    user.AccountBalance, amount);
                throw new InvalidOperationException(
                    $"Số dư không đủ. Số dư hiện tại: {user.AccountBalance:N0} VNĐ. Cần: {amount:N0} VNĐ.");
            }

            // 4. Trừ tiền từ ví
            user.AccountBalance -= amount;

            // 5. Tạo wallet transaction record
            var walletTransaction = new WalletTransaction
            {
                UserId = userId,
                Amount = amount,
                Type = WalletTransactionType.Payment,
                Status = WalletTransactionStatus.Completed,
                ReferenceId = orderId,
                Description = $"Thanh toán đơn hàng #{orderId.ToString()[..8].ToUpper()}: {amount:N0} VNĐ"
            };
            _db.WalletTransactions.Add(walletTransaction);

            // 6. Cập nhật order status = PAID
            order.PaymentStatus = PaymentStatus.paid;
            order.PaidAt = DateTime.UtcNow;
            order.Status = OrderStatus.confirmed;
            order.PaymentMethodSnapshot = JsonSerializer.Serialize(new { method = "wallet" });

            // 7. Cập nhật PaymentLog (nếu có)
            var paymentLog = await _db.PaymentLogs.FirstOrDefaultAsync(p => p.OrderId == orderId);
            if (paymentLog != null)
            {
                paymentLog.Status = "paid";
                paymentLog.PaymentMethod = "wallet";
                paymentLog.PaymentMethodName = "FNC Pay";
                paymentLog.PaidAt = DateTime.UtcNow;
                _db.PaymentLogs.Update(paymentLog);
            }

            // 8. Save + Commit (atomic)
            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            _logger.LogInformation(
                "[WalletService] ✅ PayOrderWithWallet thành công - OrderId: {OrderId}, Amount: {Amount}, NewBalance: {Balance}",
                orderId, amount, user.AccountBalance);

            return MapToDto(walletTransaction);
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            _logger.LogError(ex, "[WalletService] ❌ PayOrderWithWallet thất bại - OrderId: {OrderId}", orderId);
            throw;
        }
    }

    public async Task<WalletTransactionDto> RefundAsync(Guid userId, decimal amount, Guid? referenceId = null, string? description = null)
    {
        if (amount <= 0)
            throw new ArgumentException("Số tiền hoàn trả phải lớn hơn 0.");

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy tài khoản người dùng.");

            // Cộng lại tiền vào ví
            user.AccountBalance += amount;

            var transaction = new WalletTransaction
            {
                UserId = userId,
                Amount = amount,
                Type = WalletTransactionType.Refund,
                Status = WalletTransactionStatus.Completed,
                ReferenceId = referenceId,
                Description = description ?? $"Hoàn tiền vào ví: {amount:N0} VNĐ"
            };

            _db.WalletTransactions.Add(transaction);
            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            _logger.LogInformation("[WalletService] ✅ Refund thành công - UserId: {UserId}, Amount: {Amount}", userId, amount);
            return MapToDto(transaction);
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> HasSufficientBalanceAsync(Guid userId, decimal amount)
    {
        var user = await _db.Users.FindAsync(userId);
        return user != null && user.AccountBalance >= amount;
    }

    private static WalletTransactionDto MapToDto(WalletTransaction t) => new()
    {
        Id = t.Id,
        Amount = t.Amount,
        Type = t.Type.ToString(),
        Status = t.Status.ToString(),
        ReferenceId = t.ReferenceId,
        Description = t.Description,
        CreatedAt = t.CreatedAt
    };
}

