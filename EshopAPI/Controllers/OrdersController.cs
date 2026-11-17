using EshopAPI.Data;
using EshopAPI.DTOs;
using EshopAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace EshopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _memoryCache;

        public OrdersController(
            ApplicationDbContext context,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            IMemoryCache memoryCache)
        {
            _context = context;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _memoryCache = memoryCache;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // POST: api/orders (Checkout)
        [HttpPost]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
        {
            var userId = GetUserId();
            var trimmedAddress = request.ShippingAddress.Trim();

            if (string.IsNullOrWhiteSpace(trimmedAddress))
            {
                return BadRequest("Shipping address is required");
            }

            try
            {
                var order = await CreateOrderFromCartAsync(userId, trimmedAddress, request.PaymentMethod);
                return Ok(order);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/orders/razorpay/create-order
        [HttpPost("razorpay/create-order")]
        public async Task<IActionResult> CreateRazorpayOrder()
        {
            var userId = GetUserId();
            var (keyId, keySecret) = GetRazorpaySettings();

            if (string.IsNullOrWhiteSpace(keyId) || string.IsNullOrWhiteSpace(keySecret))
            {
                return StatusCode(500, "Razorpay keys are not configured.");
            }

            decimal total;
            try
            {
                total = await GetCartTotalAsync(userId);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }

            if (total <= 0)
            {
                return BadRequest("Cart is empty");
            }

            var amountInPaise = ConvertToPaise(total);
            var receipt = $"cart_{userId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders");
            var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{keyId}:{keySecret}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            request.Content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    amount = amountInPaise,
                    currency = "INR",
                    receipt,
                    notes = new { userId }
                }),
                Encoding.UTF8,
                "application/json");

            var client = _httpClientFactory.CreateClient();
            using var response = await client.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, responseBody);
            }

            using var json = JsonDocument.Parse(responseBody);
            var razorpayOrderId = json.RootElement.GetProperty("id").GetString();

            if (string.IsNullOrWhiteSpace(razorpayOrderId))
            {
                return StatusCode(500, "Razorpay did not return an order id.");
            }

            _memoryCache.Set(GetRazorpayCacheKey(userId, razorpayOrderId), amountInPaise, TimeSpan.FromMinutes(15));

            return Ok(new
            {
                keyId,
                orderId = razorpayOrderId,
                amount = amountInPaise,
                currency = "INR"
            });
        }

        // POST: api/orders/razorpay/verify
        [HttpPost("razorpay/verify")]
        public async Task<IActionResult> VerifyRazorpayPayment([FromBody] VerifyRazorpayPaymentRequest request)
        {
            var userId = GetUserId();
            var trimmedAddress = request.ShippingAddress.Trim();

            if (string.IsNullOrWhiteSpace(trimmedAddress))
            {
                return BadRequest("Shipping address is required");
            }

            var cacheKey = GetRazorpayCacheKey(userId, request.RazorpayOrderId);
            if (!_memoryCache.TryGetValue<int>(cacheKey, out var cachedAmountInPaise))
            {
                return BadRequest("Payment order was not created by this server or has expired.");
            }

            decimal total;
            try
            {
                total = await GetCartTotalAsync(userId);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }

            if (ConvertToPaise(total) != cachedAmountInPaise)
            {
                _memoryCache.Remove(cacheKey);
                return BadRequest("Cart total changed after payment was started. Please try again.");
            }

            var (_, keySecret) = GetRazorpaySettings();
            if (string.IsNullOrWhiteSpace(keySecret))
            {
                return StatusCode(500, "Razorpay secret is not configured.");
            }

            if (!IsValidRazorpaySignature(request.RazorpayOrderId, request.RazorpayPaymentId, request.RazorpaySignature, keySecret))
            {
                return BadRequest("Invalid Razorpay payment signature.");
            }

            Order order;
            try
            {
                order = await CreateOrderFromCartAsync(userId, trimmedAddress, $"Razorpay - {request.RazorpayPaymentId}");
                _memoryCache.Remove(cacheKey);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }

            return Ok(order);
        }

        private async Task<Order> CreateOrderFromCartAsync(int userId, string shippingAddress, string paymentMethod)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                .SingleOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.Items.Any())
                throw new InvalidOperationException("Cart is empty");

            foreach (var item in cart.Items)
            {
                if (item.Product == null)
                {
                    throw new InvalidOperationException("A cart product is no longer available.");
                }

                if (item.Product.Stock < item.Quantity)
                {
                    throw new InvalidOperationException($"Only {item.Product.Stock} units of {item.Product.Name} are available.");
                }
            }

            var order = new Order
            {
                UserId = userId,
                Total = cart.Items.Sum(i => i.Quantity * i.Product!.Price),
                Status = "Pending",
                PaymentMethod = paymentMethod,
                ShippingAddress = shippingAddress,
                Items = cart.Items.Select(i => new OrderItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    Price = i.Product!.Price
                }).ToList()
            };

            var user = await _context.Users.FindAsync(userId);
            if (user != null && user.Address != shippingAddress)
            {
                user.Address = shippingAddress;
            }

            _context.Orders.Add(order);
            _context.CartItems.RemoveRange(cart.Items); // clear cart

            // Reduce stock
            foreach (var item in cart.Items)
            {
                if (item.Product != null)
                {
                    item.Product.Stock -= item.Quantity;
                }
            }

            await _context.SaveChangesAsync();

            return order;
        }

        // GET: api/orders (User History)
        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetUserId();
            var orders = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(orders);
        }

        // PUT: api/orders/5/cancel
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var userId = GetUserId();

            var order = await _context.Orders
                .Include(o => o.Items)
                .SingleOrDefaultAsync(o => o.Id == id && o.UserId == userId);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            if (order.Status == "Cancelled")
            {
                return BadRequest("Order is already cancelled.");
            }

            if (order.Status == "Delivered")
            {
                return BadRequest("Delivered orders cannot be cancelled.");
            }

            await RestoreStockAsync(order.Items);

            order.Status = "Cancelled";
            await _context.SaveChangesAsync();

            return Ok(order);
        }

        // GET: api/orders/5/status
        [HttpGet("{id}/status")]
        public async Task<IActionResult> GetOrderStatus(int id)
        {
            var userId = GetUserId();
            var isAdmin = User.IsInRole("Admin");

            var order = await _context.Orders
                .Where(o => o.Id == id)
                .Select(o => new { o.Id, o.UserId, o.Status })
                .SingleOrDefaultAsync();

            if (order == null)
            {
                return NotFound("Order not found");
            }

            if (!isAdmin && order.UserId != userId)
            {
                return Forbid();
            }

            return Ok(new { order.Id, order.Status });
        }

        // GET: api/orders/5/invoice
        [HttpGet("{id}/invoice")]
        public async Task<IActionResult> GetInvoice(int id)
        {
            var userId = GetUserId();
            var isAdmin = User.IsInRole("Admin");

            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .SingleOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            if (!isAdmin && order.UserId != userId)
            {
                return Forbid();
            }

            return Ok(new
            {
                invoiceNumber = $"INV-{order.CreatedAt:yyyyMMdd}-{order.Id:D5}",
                order.Id,
                order.CreatedAt,
                order.Status,
                order.PaymentMethod,
                order.ShippingAddress,
                order.Total,
                customer = new
                {
                    order.UserId,
                    Name = order.User?.Name ?? "Customer",
                    Email = order.User?.Email ?? string.Empty
                },
                items = order.Items.Select(item => new
                {
                    item.Id,
                    item.ProductId,
                    ProductName = item.Product?.Name ?? $"Product #{item.ProductId}",
                    item.Quantity,
                    UnitPrice = item.Price,
                    LineTotal = item.Price * item.Quantity
                })
            });
        }

        // GET: api/orders/all (Admin)
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(orders);
        }

        // PUT: api/orders/5/status (Admin)
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] OrderStatusRequest request)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound("Order not found");

            order.Status = request.Status; // Expected: "Pending", "Shipped", "Delivered", "Cancelled"
            await _context.SaveChangesAsync();

            return Ok(order);
        }

        // DELETE: api/orders/5 (Admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .SingleOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            if (order.Status != "Delivered" && order.Status != "Cancelled")
            {
                await RestoreStockAsync(order.Items);
            }

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order deleted successfully." });
        }

        private async Task RestoreStockAsync(IEnumerable<OrderItem> items)
        {
            if (!items.Any())
            {
                return;
            }

            var productIds = items.Select(i => i.ProductId).Distinct().ToList();
            if (productIds.Count == 0)
            {
                return;
            }

            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            foreach (var item in items)
            {
                if (products.TryGetValue(item.ProductId, out var product))
                {
                    product.Stock += item.Quantity;
                }
            }
        }

        private async Task<decimal> GetCartTotalAsync(int userId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                .SingleOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.Items.Any())
            {
                return 0;
            }

            foreach (var item in cart.Items)
            {
                if (item.Product == null)
                {
                    throw new InvalidOperationException("A cart product is no longer available.");
                }

                if (item.Product.Stock < item.Quantity)
                {
                    throw new InvalidOperationException($"Only {item.Product.Stock} units of {item.Product.Name} are available.");
                }
            }

            return cart.Items.Sum(i => i.Quantity * i.Product!.Price);
        }

        private (string? KeyId, string? KeySecret) GetRazorpaySettings()
        {
            var keyId = _configuration["Razorpay:KeyId"];
            var keySecret = _configuration["Razorpay:KeySecret"];

            return (keyId, keySecret);
        }

        private static int ConvertToPaise(decimal amount)
        {
            return (int)Math.Round(amount * 100, MidpointRounding.AwayFromZero);
        }

        private static string GetRazorpayCacheKey(int userId, string razorpayOrderId)
        {
            return $"razorpay-order:{userId}:{razorpayOrderId}";
        }

        private static bool IsValidRazorpaySignature(string orderId, string paymentId, string signature, string keySecret)
        {
            var payload = $"{orderId}|{paymentId}";
            var secretBytes = Encoding.UTF8.GetBytes(keySecret);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);

            using var hmac = new HMACSHA256(secretBytes);
            var hash = hmac.ComputeHash(payloadBytes);
            var generatedSignature = Convert.ToHexString(hash).ToLowerInvariant();

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(generatedSignature),
                Encoding.UTF8.GetBytes(signature.ToLowerInvariant()));
        }
    }
}
