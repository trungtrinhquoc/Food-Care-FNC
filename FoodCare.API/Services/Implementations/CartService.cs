using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Cart;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using System.Text.Json;

namespace FoodCare.API.Services.Implementations;

public class CartService : ICartService
{
    private readonly FoodCareDbContext _context;
    private readonly ILogger<CartService> _logger;
    private const decimal FreeShippingThreshold = 150_000m;
    private const decimal StandardShippingFee = 15_000m;

    public CartService(FoodCareDbContext context, ILogger<CartService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CartDto> GetCartAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("Người dùng không tồn tại");

        var cartItems = await _context.CartItems
            .Include(ci => ci.Product)
                .ThenInclude(p => p.Supplier)
            .Where(ci => ci.UserId == userId)
            .OrderByDescending(ci => ci.IsSubscription)
            .ThenBy(ci => ci.CreatedAt)
            .ToListAsync();

        // Get user's active subscriptions to mark "Trong sub" items
        var activeSubProductIdsList = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubStatus.active && s.ProductId != null)
            .Select(s => s.ProductId!.Value)
            .ToListAsync();
        var activeSubProductIds = new HashSet<Guid>(activeSubProductIdsList);

        var subItems = new List<CartItemDto>();
        var oneTimeItems = new List<CartItemDto>();

        foreach (var ci in cartItems)
        {
            var dto = new CartItemDto
            {
                Id = ci.Id,
                ProductId = ci.ProductId,
                ProductName = ci.Product.Name,
                ProductImage = ci.Product.Images,
                Price = ci.Product.BasePrice,
                Quantity = ci.Quantity,
                TotalPrice = ci.Product.BasePrice * ci.Quantity,
                IsSubscription = ci.IsSubscription,
                SubscriptionFrequency = ci.SubscriptionFrequency,
                IsInActiveSubscription = activeSubProductIds.Contains(ci.ProductId),
                StockStatus = ci.Product.StockQuantity == null ? "Còn hàng"
                            : ci.Product.StockQuantity <= 0 ? "Hết hàng"
                            : ci.Product.StockQuantity <= 5 ? $"Còn {ci.Product.StockQuantity} cái"
                            : "Còn hàng"
            };

            if (ci.IsSubscription)
                subItems.Add(dto);
            else
                oneTimeItems.Add(dto);
        }

        var subtotal = subItems.Sum(i => i.TotalPrice) + oneTimeItems.Sum(i => i.TotalPrice);
        var subTotal = subItems.Sum(i => i.TotalPrice);

        // Check active subscriptions total for free shipping
        var activeSubsTotal = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubStatus.active && s.Product != null)
            .SumAsync(s => s.Product!.BasePrice * (s.Quantity ?? 1));

        var totalSubValue = subTotal + activeSubsTotal;
        var isFreeShipping = totalSubValue >= FreeShippingThreshold;
        var shippingFee = isFreeShipping ? 0m : StandardShippingFee;
        var totalAmount = subtotal + shippingFee;

        // Get mart info
        int? martId = user.SelectedMartId;
        string? martName = null;
        if (martId.HasValue)
        {
            martName = await _context.Suppliers
                .Where(s => s.Id == martId.Value)
                .Select(s => s.StoreName)
                .FirstOrDefaultAsync();
        }

        return new CartDto
        {
            SubscriptionItems = subItems,
            OneTimeItems = oneTimeItems,
            Subtotal = subtotal,
            ShippingFee = shippingFee,
            TotalAmount = totalAmount,
            IsFreeShipping = isFreeShipping,
            ShippingNote = isFreeShipping
                ? "Miễn phí giao hàng (subscription từ 150.000đ)"
                : $"Phí giao: {StandardShippingFee:N0}đ (thêm subscription để miễn phí)",
            MartId = martId,
            MartName = martName,
            WalletBalance = user.AccountBalance,
            WalletAfterPayment = user.AccountBalance - totalAmount,
            HasSufficientBalance = user.AccountBalance >= totalAmount
        };
    }

    public async Task<CartItemDto> AddToCartAsync(Guid userId, AddToCartDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("Người dùng không tồn tại");

        var product = await _context.Products
            .Include(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId && p.IsActive == true && p.IsDeleted != true);

        if (product == null)
            throw new InvalidOperationException("Sản phẩm không tồn tại");

        // Enforce 1-order-1-mart: product must belong to user's selected mart
        if (user.SelectedMartId.HasValue && product.SupplierId != user.SelectedMartId)
            throw new InvalidOperationException("Sản phẩm không thuộc mart đang chọn. Vui lòng chuyển mart trước khi thêm vào giỏ.");

        // Check for existing cart item with same product+subscription type
        var existing = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.UserId == userId
                                    && ci.ProductId == dto.ProductId
                                    && ci.IsSubscription == dto.IsSubscription);

        if (existing != null)
        {
            existing.Quantity += dto.Quantity;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new CartItem
            {
                UserId = userId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                IsSubscription = dto.IsSubscription,
                SubscriptionFrequency = dto.SubscriptionFrequency
            };
            _context.CartItems.Add(existing);
        }

        await _context.SaveChangesAsync();

        return new CartItemDto
        {
            Id = existing.Id,
            ProductId = product.Id,
            ProductName = product.Name,
            ProductImage = product.Images,
            Price = product.BasePrice,
            Quantity = existing.Quantity,
            TotalPrice = product.BasePrice * existing.Quantity,
            IsSubscription = existing.IsSubscription,
            SubscriptionFrequency = existing.SubscriptionFrequency
        };
    }

    public async Task<CartItemDto?> UpdateCartItemAsync(Guid userId, Guid cartItemId, UpdateCartItemDto dto)
    {
        var cartItem = await _context.CartItems
            .Include(ci => ci.Product)
            .FirstOrDefaultAsync(ci => ci.Id == cartItemId && ci.UserId == userId);

        if (cartItem == null) return null;

        cartItem.Quantity = dto.Quantity;
        cartItem.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new CartItemDto
        {
            Id = cartItem.Id,
            ProductId = cartItem.ProductId,
            ProductName = cartItem.Product.Name,
            ProductImage = cartItem.Product.Images,
            Price = cartItem.Product.BasePrice,
            Quantity = cartItem.Quantity,
            TotalPrice = cartItem.Product.BasePrice * cartItem.Quantity,
            IsSubscription = cartItem.IsSubscription,
            SubscriptionFrequency = cartItem.SubscriptionFrequency
        };
    }

    public async Task<bool> RemoveCartItemAsync(Guid userId, Guid cartItemId)
    {
        var cartItem = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.Id == cartItemId && ci.UserId == userId);

        if (cartItem == null) return false;

        _context.CartItems.Remove(cartItem);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ClearCartAsync(Guid userId)
    {
        var items = await _context.CartItems.Where(ci => ci.UserId == userId).ToListAsync();
        _context.CartItems.RemoveRange(items);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<CartCheckoutResultDto> CheckoutFromCartAsync(Guid userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new InvalidOperationException("Người dùng không tồn tại");

            var cartItems = await _context.CartItems
                .Include(ci => ci.Product)
                .Where(ci => ci.UserId == userId)
                .ToListAsync();

            if (cartItems.Count == 0)
                throw new InvalidOperationException("Giỏ hàng trống");

            // Calculate totals
            var subtotal = cartItems.Sum(ci => ci.Product.BasePrice * ci.Quantity);
            var hasSubItems = cartItems.Any(ci => ci.IsSubscription);

            var activeSubsTotal = await _context.Subscriptions
                .Where(s => s.UserId == userId && s.Status == SubStatus.active && s.Product != null)
                .SumAsync(s => s.Product!.BasePrice * (s.Quantity ?? 1));

            var isFreeShipping = (activeSubsTotal + cartItems.Where(ci => ci.IsSubscription).Sum(ci => ci.Product.BasePrice * ci.Quantity)) >= FreeShippingThreshold;
            var shippingFee = isFreeShipping ? 0m : StandardShippingFee;
            var totalAmount = subtotal + shippingFee;

            // Check wallet balance
            var balanceBefore = user.AccountBalance;
            if (balanceBefore < totalAmount)
                throw new InvalidOperationException($"Số dư ví không đủ. Cần {totalAmount:N0}đ, hiện có {balanceBefore:N0}đ");

            // Get default address for snapshot
            var address = await _context.Addresses
                .Where(a => a.UserId == userId && a.IsDefault == true)
                .FirstOrDefaultAsync()
                ?? await _context.Addresses
                    .Where(a => a.UserId == userId)
                    .OrderByDescending(a => a.CreatedAt)
                    .FirstOrDefaultAsync();

            var addressSnapshot = address != null
                ? JsonSerializer.Serialize(new
                {
                    address.RecipientName,
                    address.PhoneNumber,
                    address.AddressLine1,
                    address.AddressLine2,
                    address.Ward,
                    address.District,
                    address.City
                })
                : "{}";

            // Create order
            var order = new Order
            {
                UserId = userId,
                Subtotal = subtotal,
                ShippingFee = shippingFee,
                TotalAmount = totalAmount,
                ShippingAddressSnapshot = addressSnapshot,
                Status = OrderStatus.pending,
                PaymentStatus = PaymentStatus.paid,
                PaidAt = DateTime.UtcNow,
                IsSubscriptionOrder = hasSubItems,
                MartId = user.SelectedMartId,
                Note = hasSubItems ? "Đơn hàng có sản phẩm subscription" : null
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Create order items
            foreach (var ci in cartItems)
            {
                _context.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = ci.ProductId,
                    ProductName = ci.Product.Name,
                    Quantity = ci.Quantity,
                    Price = ci.Product.BasePrice
                });
            }

            // Deduct wallet
            user.AccountBalance -= totalAmount;
            user.UpdatedAt = DateTime.UtcNow;

            // Create wallet transaction
            _context.WalletTransactions.Add(new WalletTransaction
            {
                UserId = userId,
                Amount = totalAmount,
                Type = WalletTransactionType.Payment,
                Status = WalletTransactionStatus.Completed,
                Description = $"Thanh toán đơn hàng",
                ReferenceId = order.Id
            });

            // Create initial status history
            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                PreviousStatus = null,
                NewStatus = OrderStatus.pending,
                Note = "Đơn hàng mới từ giỏ hàng - Ví đã trừ tiền",
                CreatedBy = userId
            });

            // Clear cart
            _context.CartItems.RemoveRange(cartItems);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("User {UserId} checkout order {OrderId} total {Total}", userId, order.Id, totalAmount);

            return new CartCheckoutResultDto
            {
                OrderId = order.Id,
                OrderNumber = order.Id.ToString()[..8].ToUpper(),
                TotalAmount = totalAmount,
                WalletBalanceBefore = balanceBefore,
                WalletBalanceAfter = user.AccountBalance
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
