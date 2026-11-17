using EshopAPI.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options => {
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();

// Configure EF Core with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Key"];
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!))
    };
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "https://localhost:5173",
                "https://localhost:5174",
                "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await SeedCatalogIfEmptyAsync(context);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure wwwroot exists so StaticFiles middleware binds correctly on first run
var wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
if (!Directory.Exists(wwwrootPath))
{
    Directory.CreateDirectory(wwwrootPath);
}

app.UseStaticFiles();
app.UseCors("AllowFrontend");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => "E-Shop API is Running");

app.Run();

static async Task SeedCatalogIfEmptyAsync(ApplicationDbContext context)
{
    await context.Database.MigrateAsync();

    if (await context.Products.AnyAsync() || await context.Categories.AnyAsync())
    {
        return;
    }

    var seededCategories = new[]
    {
        new { Name = "Mobile" },
        new { Name = "Laptop" },
        new { Name = "Audio" },
        new { Name = "Gaming" },
        new { Name = "Accessories" }
    };

    foreach (var category in seededCategories)
    {
        context.Categories.Add(new EshopAPI.Models.Category { Name = category.Name });
    }

    await context.SaveChangesAsync();

    var categoryMap = await context.Categories.ToDictionaryAsync(c => c.Name, c => c.Id);

    var seededProducts = new[]
    {
        new EshopAPI.Models.Product { Name = "Aster X Pro Phone", Description = "Flagship mobile phone with OLED display, 5G support, and all-day battery.", Price = 699.99m, Stock = 18, CategoryId = categoryMap["Mobile"], ImageUrl = "/images/products/product-01.svg" },
        new EshopAPI.Models.Product { Name = "Volt Mini Phone", Description = "Compact smartphone with dual camera and fast charging for everyday use.", Price = 349.99m, Stock = 25, CategoryId = categoryMap["Mobile"], ImageUrl = "/images/products/product-02.svg" },
        new EshopAPI.Models.Product { Name = "NebulaBook Air 14", Description = "Lightweight laptop built for students and remote work with long battery life.", Price = 899.99m, Stock = 12, CategoryId = categoryMap["Laptop"], ImageUrl = "/images/products/product-03.svg" },
        new EshopAPI.Models.Product { Name = "Titan Workstation 15", Description = "Performance laptop with powerful processor, fast SSD, and creator-grade display.", Price = 1299.99m, Stock = 9, CategoryId = categoryMap["Laptop"], ImageUrl = "/images/products/product-04.svg" },
        new EshopAPI.Models.Product { Name = "EchoMax Headphones", Description = "Over-ear wireless headphones with rich bass and active noise cancellation.", Price = 149.99m, Stock = 20, CategoryId = categoryMap["Audio"], ImageUrl = "/images/products/product-05.svg" },
        new EshopAPI.Models.Product { Name = "Spark Beam Earbuds", Description = "True wireless earbuds with compact charging case and low latency mode.", Price = 79.99m, Stock = 34, CategoryId = categoryMap["Audio"], ImageUrl = "/images/products/product-06.svg" },
        new EshopAPI.Models.Product { Name = "WaveBox Speaker", Description = "Portable Bluetooth speaker with punchy sound and water-resistant design.", Price = 89.99m, Stock = 27, CategoryId = categoryMap["Audio"], ImageUrl = "/images/products/product-07.svg" },
        new EshopAPI.Models.Product { Name = "Rogue RGB Mouse", Description = "Gaming mouse with precision sensor, RGB lighting, and ergonomic shell.", Price = 54.99m, Stock = 31, CategoryId = categoryMap["Gaming"], ImageUrl = "/images/products/product-08.svg" },
        new EshopAPI.Models.Product { Name = "Strike Mechanical Keyboard", Description = "Tactile gaming keyboard with responsive switches and compact layout.", Price = 99.99m, Stock = 16, CategoryId = categoryMap["Gaming"], ImageUrl = "/images/products/product-09.svg" },
        new EshopAPI.Models.Product { Name = "Phantom Gaming Headset", Description = "Immersive headset with soft cushions, boom mic, and surround sound.", Price = 84.99m, Stock = 22, CategoryId = categoryMap["Gaming"], ImageUrl = "/images/products/product-10.svg" },
        new EshopAPI.Models.Product { Name = "DockFlex USB-C Hub", Description = "Multi-port hub with HDMI, USB-A, SD card support, and passthrough charging.", Price = 64.99m, Stock = 19, CategoryId = categoryMap["Accessories"], ImageUrl = "/images/products/product-11.svg" },
        new EshopAPI.Models.Product { Name = "ChargeCore 20000", Description = "High-capacity power bank with dual-port fast charging on the go.", Price = 49.99m, Stock = 29, CategoryId = categoryMap["Accessories"], ImageUrl = "/images/products/product-12.svg" },
        new EshopAPI.Models.Product { Name = "SnapStand Wireless Charger", Description = "Wireless charging stand for desk use with portrait and landscape support.", Price = 39.99m, Stock = 24, CategoryId = categoryMap["Accessories"], ImageUrl = "/images/products/product-13.svg" },
        new EshopAPI.Models.Product { Name = "VisionCam 4K", Description = "Sharp 4K webcam for meetings and streaming with built-in stereo microphones.", Price = 119.99m, Stock = 14, CategoryId = categoryMap["Accessories"], ImageUrl = "/images/products/product-14.svg" },
        new EshopAPI.Models.Product { Name = "PocketTag Tracker", Description = "Smart item tracker for keys, bags, and wallets with simple mobile pairing.", Price = 29.99m, Stock = 41, CategoryId = categoryMap["Accessories"], ImageUrl = "/images/products/product-15.svg" }
    };

    context.Products.AddRange(seededProducts);
    await context.SaveChangesAsync();
}
