namespace EshopAPI.DTOs
{
    public class AnalyticsSummaryDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalProducts { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class MonthlyCountDto
    {
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class MonthlyGrowthDto
    {
        public string Label { get; set; } = string.Empty;
        public int TotalUsers { get; set; }
    }

    public class MonthlySalesDto
    {
        public string Label { get; set; } = string.Empty;
        public int Orders { get; set; }
        public decimal Revenue { get; set; }
    }

    public class BestSellingProductDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class CategorySalesDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class AdminAnalyticsResponseDto
    {
        public AnalyticsSummaryDto Summary { get; set; } = new();
        public List<MonthlyCountDto> MonthlyRegistrations { get; set; } = [];
        public List<MonthlyGrowthDto> UserGrowth { get; set; } = [];
        public List<MonthlySalesDto> MonthlySales { get; set; } = [];
        public List<BestSellingProductDto> BestSellingProducts { get; set; } = [];
        public List<CategorySalesDto> CategorySales { get; set; } = [];
    }
}
