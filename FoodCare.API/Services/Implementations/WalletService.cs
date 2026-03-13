using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations;

public class WalletService : IWalletService
{
    private readonly FoodCareDbContext _db;

    public WalletService(FoodCareDbContext db)
    {
        _db = db;
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

        return MapToDto(transaction);
    }

    public async Task<WalletTransactionDto> DeductAsync(Guid userId, decimal amount, Guid? referenceId = null, string? description = null)
    {
        if (amount <= 0)
            throw new ArgumentException("Số tiền trừ phải lớn hơn 0.");

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

        return MapToDto(transaction);
    }

    public async Task<WalletTransactionDto> RefundAsync(Guid userId, decimal amount, Guid? referenceId = null, string? description = null)
    {
        if (amount <= 0)
            throw new ArgumentException("Số tiền hoàn trả phải lớn hơn 0.");

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

        return MapToDto(transaction);
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
