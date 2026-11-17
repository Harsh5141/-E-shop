import { Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

const FavoriteButton = ({ product, className = '', iconSize = 18 }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(product.id);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await toggleFavorite(product);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      className={`inline-flex items-center justify-center rounded-full border transition ${active ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-white/70 bg-white/90 text-slate-600 hover:text-rose-600'} ${className}`}
    >
      <Heart size={iconSize} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
};

export default FavoriteButton;
