using EshopAPI.Data;
using EshopAPI.DTOs;
using EshopAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EshopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/products
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] int? categoryId,
            [FromQuery] string? search,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] string? sortBy,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 8)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .AsNoTracking()
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.Name.Contains(search) || p.Description.Contains(search));
            }

            // Capture the available catalog range before applying the active price filter.
            var availableMinPrice = await query.Select(p => (decimal?)p.Price).MinAsync() ?? 0;
            var availableMaxPrice = await query.Select(p => (decimal?)p.Price).MaxAsync() ?? 0;

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            query = sortBy?.ToLowerInvariant() switch
            {
                "lowtohigh" => query.OrderBy(p => p.Price).ThenByDescending(p => p.Id),
                "hightolow" => query.OrderByDescending(p => p.Price).ThenByDescending(p => p.Id),
                _ => query.OrderByDescending(p => p.Id)
            };

            var total = await query.CountAsync();
            var normalizedPage = page < 1 ? 1 : page;
            var normalizedPageSize = pageSize < 1 ? 8 : pageSize;
            var products = await query
                .Skip((normalizedPage - 1) * normalizedPageSize)
                .Take(normalizedPageSize)
                .ToListAsync();

            return Ok(new {
                MinAvailablePrice = availableMinPrice,
                MaxAvailablePrice = availableMaxPrice,
                Total = total,
                Page = normalizedPage,
                PageSize = normalizedPageSize,
                Products = products
            });
        }

        // GET: api/products/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return NotFound("Product not found");

            return Ok(product);
        }

        // POST: api/products (Admin Only)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProduct([FromBody] ProductRequest request)
        {
            var product = new Product
            {
                Name = request.Name,
                Price = request.Price,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                Stock = request.Stock,
                CategoryId = request.CategoryId
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        // PUT: api/products/5 (Admin Only)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductRequest request)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound("Product not found");

            product.Name = request.Name;
            product.Price = request.Price;
            product.Description = request.Description;
            product.ImageUrl = request.ImageUrl;
            product.Stock = request.Stock;
            product.CategoryId = request.CategoryId;

            await _context.SaveChangesAsync();
            return Ok(product);
        }

        // POST: api/products/upload (Admin Only)
        [HttpPost("upload")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "products");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // Return relative URL for frontend
            var fileUrl = $"/images/products/{uniqueFileName}";
            return Ok(new { url = fileUrl });
        }

        // DELETE: api/products/5 (Admin Only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound("Product not found");

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product deleted successfully" });
        }

        // DELETE: api/products/all (Admin Only)
        [HttpDelete("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAllOldProducts()
        {
            var referencedProductIds = await _context.OrderItems
                .Select(oi => oi.ProductId)
                .Distinct()
                .ToListAsync();

            var removableProducts = await _context.Products
                .Where(p => !referencedProductIds.Contains(p.Id))
                .ToListAsync();

            if (removableProducts.Count == 0)
                return Ok(new { message = "No removable old products found.", deletedCount = 0 });

            var removableProductIds = removableProducts.Select(p => p.Id).ToList();

            var cartItems = await _context.CartItems
                .Where(ci => removableProductIds.Contains(ci.ProductId))
                .ToListAsync();

            if (cartItems.Count > 0)
            {
                _context.CartItems.RemoveRange(cartItems);
            }

            _context.Products.RemoveRange(removableProducts);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Old products deleted successfully.",
                deletedCount = removableProducts.Count,
                skippedOrderedProducts = referencedProductIds.Count
            });
        }
    }
}
