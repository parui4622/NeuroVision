// Centralized API base URL configuration
// Development: empty string so requests use Vite proxy (configured in vite.config.js)
// Production: VITE_API_URL (set in Vercel dashboard to your Render backend URL)
export const API_BASE_URL =
  import.meta.env.MODE === 'development'
    ? ''
    : (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '');

if (import.meta.env.MODE === 'production' && !API_BASE_URL) {
  console.warn('VITE_API_URL is not configured. Set it in your Vercel environment variables.');
}
