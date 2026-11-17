using EshopAPI.Controllers;
using EshopAPI.Data;
using EshopAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Xunit;

namespace EshopAPI.Tests
{
    public class CategoriesControllerTests
    {
        private ApplicationDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task GetCategories_ReturnsOk_WithCategories()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            context.Categories.Add(new Category { Name = "Test Category 1" });
            context.Categories.Add(new Category { Name = "Test Category 2" });
            await context.SaveChangesAsync();

            var controller = new CategoriesController(context);

            // Act
            var result = await controller.GetCategories();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var categories = Assert.IsAssignableFrom<System.Collections.Generic.IEnumerable<Category>>(okResult.Value);
            Assert.Equal(2, ((System.Collections.Generic.List<Category>)categories).Count);
        }

        [Fact]
        public async Task CreateCategory_ReturnsCreatedAtAction_WhenValid()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var controller = new CategoriesController(context);
            var newCategory = new Category { Name = "New Electronics" };

            // Act
            var result = await controller.CreateCategory(newCategory);

            // Assert
            var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result);
            var category = Assert.IsType<Category>(createdAtActionResult.Value);
            Assert.Equal("New Electronics", category.Name);
            Assert.True(category.Id > 0);
        }
    }
}
