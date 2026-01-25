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
                        address = dto.ShippingAddress
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

                // 4. Tạo PaymentLog nếu có UserId
                if (dto.UserId.HasValue)
                {
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

        public async Task<OrdersDto?> GetOrderByIdAsync(Guid id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            return order == null ? null : _mapper.Map<OrdersDto>(order);
        }

        public async Task<List<OrdersDto>> GetOrdersByUserIdAsync(Guid userId)
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return _mapper.Map<List<OrdersDto>>(orders);
        }
    }
}
