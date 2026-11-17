import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../config/api';
import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import FavoriteButton from '../components/FavoriteButton';
import { resolveImageUrl } from '../utils/imageUrl';
import { formatINR } from '../utils/currency';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (error) {
        console.error('Error fetching product', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.info('Please log in to add items to cart.');
      return;
    }
    try {
      await api.post('/cart', { productId: product.id, quantity });
      toast.success(`${quantity} x ${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart.');
    }
  };

  if (loading) return <div className="text-center p-20 text-xl font-medium text-gray-600 animate-pulse">Loading product details...</div>;
  if (!product) return <div className="text-center p-20 text-xl font-medium text-gray-600">Product not found.</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-8 font-medium transition">
        <ArrowLeft size={20} className="mr-2" /> Back to Products
      </Link>
      
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-8">
          <img 
            src={resolveImageUrl(product.imageUrl, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80')} 
            alt={product.name}
            className="w-full h-auto object-contain max-h-[500px] rounded-xl mix-blend-multiply hover:scale-105 transition-transform duration-500"
          />
        </div>
        
        {/* Details Section */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-3">{product.category?.name || 'Category'}</div>
          <div className="mb-4 flex items-start justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>
            <FavoriteButton product={product} className="h-12 w-12 shrink-0 border-slate-200 bg-white shadow-sm" iconSize={20} />
          </div>
          
          <div className="flex items-center space-x-2 mb-6">
             <div className="flex text-amber-400">
               {[...Array(5)].map((_, i) => (
                 <Star key={i} size={18} fill={i < Math.round(product.rating || 4) ? "currentColor" : "none"} />
               ))}
             </div>
             <span className="text-gray-500 text-sm font-medium">({product.numReviews || 12} reviews)</span>
          </div>

          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            {product.description || "No detailed description available for this product."}
          </p>

          <div className="flex items-end space-x-4 mb-8">
            <span className="text-4xl font-extrabold text-gray-900">{formatINR(product.price)}</span>
            {product.stock > 0 ? (
               <span className="text-green-600 font-medium pb-1 flex items-center"><ShieldCheck size={18} className="mr-1"/> In Stock ({product.stock})</span>
            ) : (
               <span className="text-red-500 font-medium pb-1 flex items-center"><ShieldCheck size={18} className="mr-1" /> Out of Stock</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-indigo-50 p-4 rounded-xl flex items-center text-indigo-900">
                <Truck className="mr-3 text-indigo-500" />
                <span className="text-sm font-semibold">Free Shipping on orders over {formatINR(50)}</span>
             </div>
             <div className="bg-emerald-50 p-4 rounded-xl flex items-center text-emerald-900">
                <ShieldCheck className="mr-3 text-emerald-500" />
                <span className="text-sm font-semibold">1 Year Included Warranty</span>
             </div>
          </div>

          <hr className="border-gray-100 mb-8" />

          {/* Add to Cart Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white overflow-hidden w-full sm:w-32">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-14 text-gray-600 hover:bg-gray-100 font-bold transition text-xl flex items-center justify-center"
              >-</button>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                className="w-full text-center font-bold text-gray-900 focus:outline-none appearance-none"
                min="1"
                max={product.stock}
              />
              <button 
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-10 h-14 text-gray-600 hover:bg-gray-100 font-bold transition text-xl flex items-center justify-center"
              >+</button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="flex-1 bg-indigo-600 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 hover:shadow-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed w-full shadow-md"
            >
              <ShoppingCart size={22} />
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
