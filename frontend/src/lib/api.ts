const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Resolves the authenticated JWT token from localStorage cache.
 * 
 * @returns {string|null} Access token or null
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

/**
 * Standard fetch wrapper that automatically appends bearer authorization
 * tokens and Content-Type configurations.
 * 
 * @param {string} path - Endpoint path (e.g. '/auth/login')
 * @param {RequestInit} [options] - Options dictionary
 * @returns {Promise<Object>} Response JSON payload
 */
export const apiRequest = async (path: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with code ${response.status}`);
  }

  return response.json();
};
