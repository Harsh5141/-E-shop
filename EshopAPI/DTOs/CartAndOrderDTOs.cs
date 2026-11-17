using System.ComponentModel.DataAnnotations;

namespace EshopAPI.DTOs
{
    public class AddToCartRequest
    {
        [Required]
        public int ProductId { get; set; }
        
        [Required, Range(1, 100)]
        public int Quantity { get; set; }
    }

    public class UpdateCartItemRequest
    {
        [Required, Range(1, 100)]
        public int Quantity { get; set; }
    }

    public class OrderStatusRequest
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }

    public class CheckoutRequest
    {
        [Required]
        public string ShippingAddress { get; set; } = string.Empty;

        [Required]
        public string PaymentMethod { get; set; } = string.Empty;
    }

    public class VerifyRazorpayPaymentRequest
    {
        [Required]
        public string RazorpayOrderId { get; set; } = string.Empty;

        [Required]
        public string RazorpayPaymentId { get; set; } = string.Empty;

        [Required]
        public string RazorpaySignature { get; set; } = string.Empty;

        [Required]
        public string ShippingAddress { get; set; } = string.Empty;
    }
}
