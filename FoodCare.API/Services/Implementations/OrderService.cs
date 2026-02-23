using AutoMapper;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Orders;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;


namespace FoodCare.API.Services.Implementations
{
    public class OrderService : IOrderService
    {
        private readonly FoodCareDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<OrderService> _logger;

        public OrderService(
            FoodCareDbContext context,
            IMapper mapper,
            ILogger<OrderService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<OrdersDto> CreateOrderAsync(CreateOrderDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. Tính subtotal
                var subtotal = dto.Items.Sum(i => i.Price * i.Quantity);

                var shippingFee = 0m;
                var discount = 0m;

                // 2. Tạo Order
                var order = new Order
                {
                    Id = Guid.NewGuid(),
                    UserId = dto.UserId,

                    Subtotal = subtotal,
                    ShippingFee = shippingFee,
                    DiscountAmount = discount,
                    TotalAmount = subtotal + shippingFee - discount,

                    ShippingAddressSnapshot = JsonSerializer.Serialize(new
                    {
                        address = dto.ShippingAddress,
                        recipientName = dto.RecipientName,
                        phoneNumber = dto.PhoneNumber
                    }),

                    PaymentMethodSnapshot = JsonSerializer.Serialize(new
                    {
                        method = dto.PaymentMethod
                    }),

                    Status = OrderStatus.pending,
                    PaymentStatus = PaymentStatus.unpaid,
                    Note = dto.Note,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);

                // 3. Tạo OrderItems
                var orderItems = dto.Items.Select(i => new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    VariantSnapshot = JsonSerializer.Serialize(i.VariantSnapshot),
                    Quantity = i.Quantity,
                    Price = i.Price,
                    TotalPrice = i.Price * i.Quantity,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.OrderItems.AddRange(orderItems);

                // 4. Cập nhật thông tin Profile người dùng nếu còn thiếu
                if (dto.UserId.HasValue)
                {
                    var user = await _context.Users.FindAsync(dto.UserId.Value);
                    if (user != null)
                    {
                        bool needsUpdate = false;
                        
                        // Cập nhật Họ tên nếu user chưa có (ví dụ mới đăng ký qua Google/Social)
                        if (string.IsNullOrEmpty(user.FullName) && !string.IsNullOrEmpty(dto.RecipientName))
                        {
                            user.FullName = dto.RecipientName;
                            needsUpdate = true;
                        }
                        
                        // Cập nhật số điện thoại nếu user chưa có
                        if ((string.IsNullOrEmpty(user.PhoneNumber) || user.PhoneNumber == "string") && !string.IsNullOrEmpty(dto.PhoneNumber))
                        {
                            user.PhoneNumber = dto.PhoneNumber;
                            needsUpdate = true;
                        }

                        if (needsUpdate)
                        {
                            user.UpdatedAt = DateTime.UtcNow;
                            _context.Users.Update(user);
                        }
                    }

                    var paymentLog = new PaymentLog
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        UserId = dto.UserId.Value,
                        Amount = order.TotalAmount,
                        PaymentMethod = dto.PaymentMethod ?? "COD",
                        PaymentMethodName = GetPaymentMethodName(dto.PaymentMethod),
                        Status = "pending",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.PaymentLogs.Add(paymentLog);
                }


                await _context.SaveChangesAsync();

                // 5. Create Subscriptions for subscription items
                var subscriptionItems = dto.Items.Where(i => i.IsSubscription).ToList();
                if (subscriptionItems.Any() && dto.UserId.HasValue)
                {
                    foreach (var item in subscriptionItems)
                    {
                        var subscription = new Subscription
                        {
                            Id = Guid.NewGuid(),
                            UserId = dto.UserId.Value,
                            ProductId = item.ProductId,
                            Frequency = MapFrequency(item.SubscriptionFrequency),
                            Quantity = item.Quantity,
                            DiscountPercent = item.SubscriptionDiscount,
                            Status = SubStatus.active,
                            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                            NextDeliveryDate = CalculateNextDeliveryDate(item.SubscriptionFrequency),
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _context.Subscriptions.Add(subscription);
                        _logger.LogInformation("Created subscription {SubscriptionId} for product {ProductId}", 
                            subscription.Id, item.ProductId);
                    }

                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                _logger.LogInformation("Order created successfully: {OrderId}", order.Id);

                return _mapper.Map<OrdersDto>(order);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating order");
                throw;
            }
        }

        private static string GetPaymentMethodName(string? method)
        {
            return method?.ToUpper() switch
            {
                "COD" => "Thanh toán khi nhận hàng",
                "MOMO" => "Ví MoMo",
                "VNPAY" => "VNPay",
                "BANKING" => "Chuyển khoản ngân hàng",
                _ => "Thanh toán khi nhận hàng"
            };
        }

        private static SubFrequency MapFrequency(string? frequency)
        {
            return frequency?.ToLower() switch
            {
                "weekly" => SubFrequency.weekly,
                "biweekly" => SubFrequency.biweekly,
                "monthly" => SubFrequency.monthly,
                _ => SubFrequency.monthly
            };
        }

        private static DateOnly CalculateNextDeliveryDate(string? frequency)
        {
            var today = DateTime.UtcNow;
            return frequency?.ToLower() switch
            {
                "weekly" => DateOnly.FromDateTime(today.AddDays(7)),
                "biweekly" => DateOnly.FromDateTime(today.AddDays(14)),
                "monthly" => DateOnly.FromDateTime(today.AddMonths(1)),
                _ => DateOnly.FromDateTime(today.AddMonths(1))
            };
        }

        public async Task<OrdersDto?> GetOrderByIdAsync(Guid id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return null;

            var result = _mapper.Map<OrdersDto>(order);

            // Populate IsReviewed
            var reviews = await _context.Reviews
                .Where(r => r.OrderId == id)
                .Select(r => r.ProductId)
                .ToListAsync();
            
            var reviewedProductIds = new HashSet<Guid?>(reviews);

            foreach (var item in result.Items)
            {
                item.IsReviewed = reviewedProductIds.Contains(item.ProductId);
            }

            return result;
        }

        public async Task<List<OrdersDto>> GetOrdersByUserIdAsync(Guid userId)
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var result = _mapper.Map<List<OrdersDto>>(orders);

            // Populate IsReviewed efficiently
            var orderIds = result.Select(o => o.Id).ToList();
            
            // Get all reviews for these orders
            var reviews = await _context.Reviews
                .Where(r => r.UserId == userId && r.OrderId != null && orderIds.Contains(r.OrderId.Value))
                .Select(r => new { r.OrderId, r.ProductId })
                .ToListAsync();

            var reviewSet = new HashSet<(Guid OrderId, Guid ProductId)>();
            foreach (var r in reviews)
            {
                if (r.OrderId.HasValue && r.ProductId.HasValue)
                    reviewSet.Add((r.OrderId.Value, r.ProductId.Value));
            }

            foreach (var order in result)
            {
                foreach (var item in order.Items)
                {
                    item.IsReviewed = reviewSet.Contains((order.Id, item.ProductId));
                }
            }

            return result;
        }
    }
}
