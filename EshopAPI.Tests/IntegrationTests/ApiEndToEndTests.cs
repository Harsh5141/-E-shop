using EshopAPI;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using EshopAPI.Data;

namespace EshopAPI.Tests.IntegrationTests;

public class ApiEndToEndTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ApiEndToEndTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace SqlServer with InMemory for tests
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb"));
            });
        });
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task EndToEndFlow_ShouldWork()
    {
        // 1. Register
        var registerPayload = new { name = "Test User", email = "test@example.com", password = "password123" };
        var registerContent = new StringContent(JsonSerializer.Serialize(registerPayload), Encoding.UTF8, "application/json");
        var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        // 2. Login
        var loginPayload = new { email = "test@example.com", password = "password123" };
        var loginContent = new StringContent(JsonSerializer.Serialize(loginPayload), Encoding.UTF8, "application/json");
        var loginResponse = await _client.PostAsync("/api/auth/login", loginContent);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var loginResult = await JsonSerializer.DeserializeAsync<JsonElement>(await loginResponse.Content.ReadAsStreamAsync());
        var token = loginResult.GetProperty("token").GetString()!;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // 3. Create category (admin - first user is admin)
        var categoryPayload = new { name = "Test Category" };
        var categoryContent = new StringContent(JsonSerializer.Serialize(categoryPayload), Encoding.UTF8, "application/json");
        var categoryResponse = await _client.PostAsync("/api/categories", categoryContent);
        Assert.Equal(HttpStatusCode.Created, categoryResponse.StatusCode);

        var categoryResult = await JsonSerializer.DeserializeAsync<JsonElement>(await categoryResponse.Content.ReadAsStreamAsync());
        var categoryId = categoryResult.GetProperty("id").GetInt32();

        // 4. Create product
        var productPayload = new
        {
            name = "Test Product",
            price = 99.99m,
            description = "Test desc",
            imageUrl = "/test.jpg",
            stock = 10,
            categoryId = categoryId
        };
        var productContent = new StringContent(JsonSerializer.Serialize(productPayload), Encoding.UTF8, "application/json");
        var productResponse = await _client.PostAsync("/api/products", productContent);
        Assert.Equal(HttpStatusCode.Created, productResponse.StatusCode);

        var productResult = await JsonSerializer.DeserializeAsync<JsonElement>(await productResponse.Content.ReadAsStreamAsync());
        var productId = productResult.GetProperty("id").GetInt32();

        // 5. Get categories
        var categoriesResponse = await _client.GetAsync("/api/categories");
        Assert.Equal(HttpStatusCode.OK, categoriesResponse.StatusCode);

        // 6. Add to cart
        var cartPayload = new { productId = productId, quantity = 2 };
        var cartContent = new StringContent(JsonSerializer.Serialize(cartPayload), Encoding.UTF8, "application/json");
        var cartResponse = await _client.PostAsync("/api/cart", cartContent);
        Assert.Equal(HttpStatusCode.OK, cartResponse.StatusCode);

        // 7. Checkout
        var orderPayload = new { shippingAddress = "123 Test St", paymentMethod = "Test" };
        var orderContent = new StringContent(JsonSerializer.Serialize(orderPayload), Encoding.UTF8, "application/json");
        var orderResponse = await _client.PostAsync("/api/orders", orderContent);
        Assert.Equal(HttpStatusCode.OK, orderResponse.StatusCode);

        // 8. Get orders
        var ordersResponse = await _client.GetAsync("/api/orders");
        Assert.Equal(HttpStatusCode.OK, ordersResponse.StatusCode);
        var ordersContent = await ordersResponse.Content.ReadAsStringAsync();
        Assert.Contains("\"id\":", ordersContent); // Verify order created
    }
}

