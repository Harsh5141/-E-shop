using System;
using System.Collections.Generic;

namespace EshopAPI.Models
{
    public class Order
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Shipped, Delivered, Cancelled
        public string PaymentMethod { get; set; } = string.Empty; // Cash on Delivery, Card, UPI
        public string ShippingAddress { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}
