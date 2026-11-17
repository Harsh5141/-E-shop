using System.ComponentModel.DataAnnotations;

namespace EshopAPI.DTOs
{
    public class ProductRequest
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required, Range(0, 1000000)]
        public decimal Price { get; set; }
        
        public string Description { get; set; } = string.Empty;
        
        public string ImageUrl { get; set; } = string.Empty;
        
        [Required, Range(0, 100000)]
        public int Stock { get; set; }
        
        [Required]
        public int CategoryId { get; set; }
    }
}
