import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import api from '../config/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import FavoriteButton from './FavoriteButton';
import { resolveImageUrl } from '../utils/imageUrl';
import { formatINR } from '../utils/currency';

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  
  const handleAddToCart = async () => {
    if (!user) {
      toast.info('Please login to add items to cart.');
      return;
    }
    try {
      await api.post('/cart', { productId: product.id, quantity: 1 });
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={resolveImageUrl(product.imageUrl, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80')} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <FavoriteButton product={product} className="absolute left-4 top-4 h-11 w-11 shadow-lg" iconSize={20} />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-indigo-600 shadow-sm">
          {formatINR(product.price)}
        </div>
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-xs font-medium text-indigo-600 mb-1 tracking-wider uppercase">{product.category?.name || 'Uncategorized'}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4">{product.description}</p>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <Link to={`/product/${product.id}`} className="text-indigo-600 font-semibold hover:text-indigo-800 transition text-sm">
            View Details
          </Link>
          <button 
            onClick={handleAddToCart}
            className="bg-gray-900 text-white p-2 rounded-lg hover:bg-indigo-600 transition shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={product.stock <= 0}
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
