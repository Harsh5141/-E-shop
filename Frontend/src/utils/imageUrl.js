import { API_ORIGIN } from '../config/api';

export const resolveImageUrl = (imageUrl, fallback) => {
  if (!imageUrl) return fallback;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${API_ORIGIN}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
};
