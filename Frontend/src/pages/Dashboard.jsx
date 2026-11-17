import { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Package, Clock, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUrl';
import { formatINR } from '../utils/currency';

const Dashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [resOrders, resProducts] = await Promise.all([
         api.get('/orders'),
         api.get('/products', { params: { pageSize: 8 } })
      ]);
      setOrders(Array.isArray(resOrders.data) ? resOrders.data : []);
      setAllProducts(resProducts.data.products || (Array.isArray(resProducts.data) ? resProducts.data : []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order if it is wrong? Delivered orders cannot be cancelled.')) return;

    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully.');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to cancel order');
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Dashboard...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-lg mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-indigo-100">View and manage your recent orders.</p>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Package className="mr-3 text-indigo-600" /> Order History
      </h2>

      {orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-lg">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition hover:shadow-md">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-gray-50 pb-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1 flex items-center"><Clock size={14} className="mr-1" /> {new Date(order.createdAt).toLocaleDateString()}</div>
                  <div className="font-mono text-xs text-gray-400">Order ID: #{order.id}</div>
                </div>
                <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                  <div className="text-lg font-bold text-gray-900">{formatINR(order.total)}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.status}
                  </span>
                  <Link
                    to={`/orders/${order.id}/invoice`}
                    className="inline-flex items-center rounded-xl border border-indigo-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-600 transition hover:bg-indigo-50"
                  >
                    <ReceiptText size={14} className="mr-2" />
                    Invoice
                  </Link>
                  {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={() => cancelOrder(order.id)}
                      className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 transition hover:bg-rose-50"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl mb-4 text-sm flex flex-col md:flex-row gap-8 border border-gray-100">
                 <div>
                   <span className="text-gray-500 font-medium block mb-1">Shipping Address</span>
                   <p className="text-gray-800 whitespace-pre-line leading-relaxed">{order.shippingAddress || "None provided"}</p>
                 </div>
                 <div>
                   <span className="text-gray-500 font-medium block mb-1">Payment Method</span>
                   <p className="text-indigo-600 font-bold">{order.paymentMethod || "Cash on Delivery"}</p>
                 </div>
              </div>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm items-center py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-400">
                        {item.quantity}x
                      </div>
                      <span className="font-medium text-gray-800">{item.product?.name || `Product #${item.productId}`}</span>
                    </div>
                    <span className="text-gray-600">{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended / All Products Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Package className="mr-3 text-indigo-600" /> Explore Products
        </h2>
        {allProducts.length === 0 ? (
          <p className="text-gray-500">No products available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {allProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition flex flex-col">
                <img src={resolveImageUrl(product.imageUrl, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80')} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-4" />
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-2">{product.category?.name || 'Category'}</p>
                <div className="mt-auto flex justify-between items-center pt-4">
                  <span className="font-extrabold text-indigo-600">{formatINR(product.price)}</span>
                  <a href={`/product/${product.id}`} className="text-sm font-bold text-gray-700 hover:text-indigo-600 transition">View Details →</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
