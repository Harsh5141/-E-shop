using EshopAPI.Data;
using EshopAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EshopAPI.Controllers
{
    [Route("api/admin/analytics")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminAnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminAnalyticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAnalytics()
        {
            var now = DateTime.UtcNow;
            var monthStarts = Enumerable.Range(0, 6)
                .Select(offset => new DateTime(now.Year, now.Month, 1).AddMonths(-5 + offset))
                .ToList();
            var activeUserCutoff = now.AddDays(-30);

            var users = await _context.Users
                .Select(u => new { u.Id, u.CreatedAt, u.LastLoginAt })
                .ToListAsync();

            var productsCount = await _context.Products.CountAsync();

            var nonCancelledOrders = await _context.Orders
                .Where(o => o.Status != "Cancelled")
                .Select(o => new { o.Id, o.Total, o.CreatedAt })
                .ToListAsync();

            var soldItems = await _context.OrderItems
                .Where(oi => oi.Order != null && oi.Order.Status != "Cancelled")
                .Include(oi => oi.Product)
                .ThenInclude(p => p!.Category)
                .Select(oi => new
                {
                    oi.ProductId,
                    ProductName = oi.Product != null ? oi.Product.Name : $"Product #{oi.ProductId}",
                    oi.Quantity,
                    oi.Price,
                    CategoryId = oi.Product != null ? oi.Product.CategoryId : 0,
                    CategoryName = oi.Product != null && oi.Product.Category != null ? oi.Product.Category.Name : "Uncategorized"
                })
                .ToListAsync();

            var monthlyRegistrations = monthStarts
                .Select(month => new MonthlyCountDto
                {
                    Label = month.ToString("MMM yyyy"),
                    Count = users.Count(u => u.CreatedAt >= month && u.CreatedAt < month.AddMonths(1))
                })
                .ToList();

            var userGrowth = monthStarts
                .Select(month => new MonthlyGrowthDto
                {
                    Label = month.ToString("MMM yyyy"),
                    TotalUsers = users.Count(u => u.CreatedAt < month.AddMonths(1))
                })
                .ToList();

            var monthlySales = monthStarts
                .Select(month => new MonthlySalesDto
                {
                    Label = month.ToString("MMM yyyy"),
                    Orders = nonCancelledOrders.Count(o => o.CreatedAt >= month && o.CreatedAt < month.AddMonths(1)),
                    Revenue = nonCancelledOrders
                        .Where(o => o.CreatedAt >= month && o.CreatedAt < month.AddMonths(1))
                        .Sum(o => o.Total)
                })
                .ToList();

            var bestSellingProducts = soldItems
                .GroupBy(item => new { item.ProductId, item.ProductName })
                .Select(group => new BestSellingProductDto
                {
                    ProductId = group.Key.ProductId,
                    Name = group.Key.ProductName,
                    QuantitySold = group.Sum(item => item.Quantity),
                    Revenue = group.Sum(item => item.Price * item.Quantity)
                })
                .OrderByDescending(item => item.QuantitySold)
                .ThenByDescending(item => item.Revenue)
                .Take(5)
                .ToList();

            var categorySales = soldItems
                .GroupBy(item => new { item.CategoryId, item.CategoryName })
                .Select(group => new CategorySalesDto
                {
                    CategoryId = group.Key.CategoryId,
                    CategoryName = group.Key.CategoryName,
                    QuantitySold = group.Sum(item => item.Quantity),
                    Revenue = group.Sum(item => item.Price * item.Quantity)
                })
                .OrderByDescending(item => item.Revenue)
                .ToList();

            var response = new AdminAnalyticsResponseDto
            {
                Summary = new AnalyticsSummaryDto
                {
                    TotalUsers = users.Count,
                    ActiveUsers = users.Count(u => u.LastLoginAt.HasValue && u.LastLoginAt.Value >= activeUserCutoff),
                    TotalProducts = productsCount,
                    TotalOrders = nonCancelledOrders.Count,
                    TotalRevenue = nonCancelledOrders.Sum(o => o.Total)
                },
                MonthlyRegistrations = monthlyRegistrations,
                UserGrowth = userGrowth,
                MonthlySales = monthlySales,
                BestSellingProducts = bestSellingProducts,
                CategorySales = categorySales
            };

            return Ok(response);
        }
    }
}
