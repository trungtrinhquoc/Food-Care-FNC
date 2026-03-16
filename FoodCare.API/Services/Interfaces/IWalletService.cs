using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FoodCare.API.Models.DTOs;
using FoodCare.API.Models.Enums;

namespace FoodCare.API.Services.Interfaces;

public interface IWalletService
{
    /// <summary>Lấy số dư tài khoản của user</summary>
    Task<decimal> GetBalanceAsync(Guid userId);

    /// <summary>Lấy lịch sử giao dịch ví của user</summary>
    Task<List<WalletTransactionDto>> GetTransactionHistoryAsync(Guid userId, int page = 1, int pageSize = 20);

    /// <summary>Nạp tiền vào ví (gọi sau khi xác nhận payment thành công)</summary>
    Task<WalletTransactionDto> TopUpAsync(Guid userId, decimal amount, Guid? referenceId = null, string? description = null);

    /// <summary>Trừ tiền từ ví để thanh toán đơn hàng</summary>
    Task<WalletTransactionDto> DeductAsync(Guid userId, decimal amount, Guid? referenceId = null, string? description = null);

    /// <summary>Hoàn tiền vào ví</summary>
    Task<WalletTransactionDto> RefundAsync(Guid userId, decimal amount, Guid? referenceId = null, string? description = null);

    /// <summary>Kiểm tra user có đủ số dư không</summary>
    Task<bool> HasSufficientBalanceAsync(Guid userId, decimal amount);

    /// <summary>
    /// Thanh toán đơn hàng bằng ví FNC Pay (atomic transaction).
    /// Trừ tiền ví + cập nhật trạng thái đơn hàng trong cùng 1 database transaction.
    /// </summary>
    Task<WalletTransactionDto> PayOrderWithWalletAsync(Guid userId, Guid orderId);
}
