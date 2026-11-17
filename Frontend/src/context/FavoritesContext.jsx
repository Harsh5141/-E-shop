import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/favorites/user/${user.id}`);
      setFavorites(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setFavorites([]);
      toast.error('Failed to load favorites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  const isFavorite = (productId) => favorites.some((favorite) => favorite.productId === productId);

  const addFavorite = async (productId) => {
    if (!user) {
      toast.info('Please log in to save favorites.');
      return false;
    }

    try {
      const response = await api.post('/favorites/add', { productId });
      setFavorites((currentFavorites) => {
        const nextFavorite = response.data;
        if (currentFavorites.some((favorite) => favorite.productId === nextFavorite.productId)) {
          return currentFavorites;
        }

        return [nextFavorite, ...currentFavorites];
      });
      toast.success('Added to favorites.');
      return true;
    } catch (error) {
      toast.error(error.response?.data || 'Failed to add favorite.');
      return false;
    }
  };

  const removeFavorite = async (favoriteIdOrProductId) => {
    if (!user) {
      return false;
    }

    try {
      await api.delete(`/favorites/remove/${favoriteIdOrProductId}`);
      setFavorites((currentFavorites) =>
        currentFavorites.filter(
          (favorite) => favorite.id !== favoriteIdOrProductId && favorite.productId !== favoriteIdOrProductId,
        ),
      );
      toast.success('Removed from favorites.');
      return true;
    } catch (error) {
      toast.error(error.response?.data || 'Failed to remove favorite.');
      return false;
    }
  };

  const toggleFavorite = async (product) => {
    if (!product?.id) {
      return false;
    }

    const existingFavorite = favorites.find((favorite) => favorite.productId === product.id);
    if (existingFavorite) {
      return removeFavorite(existingFavorite.id);
    }

    return addFavorite(product.id);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteCount: favorites.length,
        loading,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        refreshFavorites: loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
