using EshopAPI.Data;
using EshopAPI.DTOs;
using EshopAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EshopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CartController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET: api/cart
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetUserId();
            var cart = await _context.Carts
                .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                .SingleOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            return Ok(cart);
        }

        // POST: api/cart
        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            var userId = GetUserId();
            var cart = await _context.Carts
                .Include(c => c.Items)
                .SingleOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                _context.Carts.Add(cart);
            }

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null) return NotFound("Product not found");

            var cartItem = cart.Items.SingleOrDefault(i => i.ProductId == request.ProductId);
            if (cartItem == null)
            {
                cart.Items.Add(new CartItem { ProductId = request.ProductId, Quantity = request.Quantity });
            }
            else
            {
                cartItem.Quantity += request.Quantity;
            }

            await _context.SaveChangesAsync();
            return Ok(cart);
        }

        // PUT: api/cart/items/5
        [HttpPut("items/{id}")]
        public async Task<IActionResult> UpdateCartItem(int id, [FromBody] UpdateCartItemRequest request)
        {
            var userId = GetUserId();
            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .SingleOrDefaultAsync(ci => ci.Id == id && ci.Cart!.UserId == userId);

            if (cartItem == null) return NotFound("Cart item not found");

            cartItem.Quantity = request.Quantity;
            await _context.SaveChangesAsync();

            return Ok(cartItem);
        }

        // DELETE: api/cart/items/5
        [HttpDelete("items/{id}")]
        public async Task<IActionResult> RemoveCartItem(int id)
        {
            var userId = GetUserId();
            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .SingleOrDefaultAsync(ci => ci.Id == id && ci.Cart!.UserId == userId);

            if (cartItem == null) return NotFound("Cart item not found");

            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Item removed" });
        }
    }
}
