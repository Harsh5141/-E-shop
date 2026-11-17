using EshopAPI.Data;
using EshopAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EshopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    ProductCount = _context.Products.Count(p => p.CategoryId == c.Id)
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] Category category)
        {
            var normalizedName = category.Name?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedName))
                return BadRequest("Category name is required.");

            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower());
            if (categoryExists)
                return BadRequest("Category already exists.");

            category.Name = normalizedName;
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] Category request)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound("Category not found");

            var normalizedName = request.Name?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedName))
                return BadRequest("Category name is required.");

            var duplicateExists = await _context.Categories
                .AnyAsync(c => c.Id != id && c.Name.ToLower() == normalizedName.ToLower());
            if (duplicateExists)
                return BadRequest("Category already exists.");

            category.Name = normalizedName;
            await _context.SaveChangesAsync();

            return Ok(category);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound("Category not found");

            var productsInCategory = await _context.Products
                .Where(p => p.CategoryId == id)
                .ToListAsync();

            if (productsInCategory.Count > 0)
            {
                var productIds = productsInCategory.Select(p => p.Id).ToList();

                var cartItems = await _context.CartItems
                    .Where(ci => productIds.Contains(ci.ProductId))
                    .ToListAsync();

                if (cartItems.Count > 0)
                {
                    _context.CartItems.RemoveRange(cartItems);
                }

                _context.Products.RemoveRange(productsInCategory);
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return Ok(new
            {
                message = "Category deleted successfully",
                deletedProducts = productsInCategory.Count
            });
        }

        [HttpDelete("all-unused")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAllUnusedCategories()
        {
            var categoriesWithProducts = await _context.Products
                .Select(p => p.CategoryId)
                .Distinct()
                .ToListAsync();

            var unusedCategories = await _context.Categories
                .Where(c => !categoriesWithProducts.Contains(c.Id))
                .ToListAsync();

            if (unusedCategories.Count == 0)
                return Ok(new { message = "No unused categories found.", deletedCount = 0 });

            _context.Categories.RemoveRange(unusedCategories);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Unused categories deleted successfully.", deletedCount = unusedCategories.Count });
        }
    }
}
