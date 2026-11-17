import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';
import { formatINR } from '../utils/currency';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (error) {
      console.error('Error fetching cart', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    try {
      await api.put(`/cart/items/${itemId}`, { quantity: newQuantity });
      fetchCart();
    } catch (e) { console.error(e); }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      fetchCart();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Cart...</div>;

  const total = cart?.items?.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center">
        <ShoppingBag className="mr-3 text-indigo-600" size={32} /> Your Cart
      </h1>

      {!cart?.items?.length ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xl text-gray-500 mb-6">Your cart is currently empty.</p>
          <Link to="/" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cart.items.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <img src={resolveImageUrl(item.product?.imageUrl, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80')} alt={item.product?.name} className="w-24 h-24 object-cover rounded-lg bg-gray-50 mix-blend-multiply" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{item.product?.name}</h3>
                  <p className="text-indigo-600 font-semibold">{formatINR(item.product?.price)}</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg border border-gray-200">
                  <button onClick={() => updateQuantity(item.id, item.quantity, -1)} className="w-8 h-8 rounded bg-white shadow-sm font-bold text-gray-600 hover:text-indigo-600">-</button>
                  <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity, 1)} disabled={item.quantity >= item.product?.stock} className="w-8 h-8 rounded bg-white shadow-sm font-bold text-gray-600 hover:text-indigo-600 disabled:opacity-50">+</button>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6 text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(total)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="text-green-600 font-medium">Free</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{formatINR(total * 0.1)}</span></div>
                <hr className="border-gray-100" />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span><span>{formatINR(total * 1.1)}</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
              >
                Proceed to Checkout <ArrowRight size={20} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
