import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useFavorites } from '../context/FavoritesContext';

const Favorites = () => {
  const { favorites, loading } = useFavorites();

  if (loading) {
    return <div className="p-20 text-center text-slate-500">Loading favorites...</div>;
  }

  const favoriteProducts = favorites
    .map((favorite) => favorite.product)
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-2xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-rose-200">
          <Heart size={16} fill="currentColor" />
          Favorites
        </p>
        <h1 className="text-4xl font-black sm:text-5xl">Your saved products in one place.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Review the items you loved, compare them later, and move them to cart whenever you are ready.
        </p>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Heart size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-950">No favorites yet</h2>
          <p className="mt-3 text-slate-500">
            Tap the heart icon on any product card to build your wishlist.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
