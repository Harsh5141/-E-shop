using System.ComponentModel.DataAnnotations;

namespace EshopAPI.DTOs
{
    public class AddFavoriteRequest
    {
        [Required]
        public int ProductId { get; set; }
    }
}
