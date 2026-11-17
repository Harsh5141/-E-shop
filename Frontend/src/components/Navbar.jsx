import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { Heart, ShoppingCart, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { favoriteCount } = useFavorites();

  return (
    <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold tracking-tight">E-Shop</Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-100 hover:text-white transition font-medium">Products</Link>
            <Link to="/about" className="text-gray-100 hover:text-white transition font-medium">About Us</Link>
            <Link to="/contact" className="text-gray-100 hover:text-white transition font-medium">Contact</Link>
            {user ? (
              <>
                <Link to="/favorites" className="relative hover:text-indigo-200 transition">
                  <Heart size={24} />
                  {favoriteCount > 0 && (
                    <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                      {favoriteCount}
                    </span>
                  )}
                </Link>
                <Link to="/cart" className="relative hover:text-indigo-200 transition">
                  <ShoppingCart size={24} />
                  {/* Cart badge can go here */}
                </Link>
                {user.role === 'Admin' ? (
                  <Link to="/admin" className="hover:text-indigo-200 transition">Admin Dashboard</Link>
                ) : (
                  <Link to="/dashboard" className="hover:text-indigo-200 transition">Dashboard</Link>
                )}
                <div className="flex items-center space-x-2 bg-indigo-700 px-3 py-1 rounded-full">
                  <UserIcon size={16} />
                  <span className="font-medium text-sm">{user.name}</span>
                </div>
                <button onClick={logout} className="flex items-center space-x-1 text-red-200 hover:text-pink-300 transition">
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-indigo-200 transition">Login</Link>
                <Link to="/register" className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition drop-shadow-sm hover:drop-shadow-md">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
