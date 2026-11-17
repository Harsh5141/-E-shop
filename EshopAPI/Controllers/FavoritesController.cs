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
    public class FavoritesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FavoritesController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("add")]
        public async Task<IActionResult> AddFavorite([FromBody] AddFavoriteRequest request)
        {
            var userId = GetUserId();

            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == request.ProductId);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            var existingFavorite = await _context.Favorites
                .Include(f => f.Product)
                .ThenInclude(p => p!.Category)
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == request.ProductId);

            if (existingFavorite != null)
            {
                return Ok(MapFavorite(existingFavorite));
            }

            var favorite = new Favorite
            {
                UserId = userId,
                ProductId = request.ProductId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Favorites.Add(favorite);
            await _context.SaveChangesAsync();

            favorite.Product = product;

            return Ok(MapFavorite(favorite));
        }

        [HttpDelete("remove/{id}")]
        public async Task<IActionResult> RemoveFavorite(int id)
        {
            var userId = GetUserId();
            var favorite = await _context.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && (f.Id == id || f.ProductId == id));

            if (favorite == null)
            {
                return NotFound("Favorite not found.");
            }

            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Favorite removed successfully." });
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserFavorites(int userId)
        {
            var currentUserId = GetUserId();
            var isAdmin = User.IsInRole("Admin");

            if (!isAdmin && currentUserId != userId)
            {
                return Forbid();
            }

            var favorites = await _context.Favorites
                .Where(f => f.UserId == userId)
                .Include(f => f.Product)
                .ThenInclude(p => p!.Category)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return Ok(favorites.Select(MapFavorite));
        }

        private static object MapFavorite(Favorite favorite)
        {
            return new
            {
                favorite.Id,
                favorite.UserId,
                favorite.ProductId,
                favorite.CreatedAt,
                Product = favorite.Product == null ? null : new
                {
                    favorite.Product.Id,
                    favorite.Product.Name,
                    favorite.Product.Description,
                    favorite.Product.Price,
                    favorite.Product.ImageUrl,
                    favorite.Product.Stock,
                    favorite.Product.CategoryId,
                    Category = favorite.Product.Category == null ? null : new
                    {
                        favorite.Product.Category.Id,
                        favorite.Product.Category.Name
                    }
                }
            };
        }
    }
}
