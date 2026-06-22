import { useState } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  // Generate mock JWT token
  const generateToken = () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        iat: Date.now(),
        exp: Date.now() + 60 * 60 * 1000,
        sub: Math.random().toString(36).substr(2, 9),
      })
    );
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
  };

  // Refresh token
  const refreshToken = () => {
    const newToken = generateToken();
    const newExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    setToken(newToken);
    setTokenExpiry(newExpiry);
    localStorage.setItem('token', newToken);
    localStorage.setItem('tokenExpiry', newExpiry.toString());
  };

  // Check and refresh token
  const checkAndRefreshToken = () => {
    const storedExpiry = localStorage.getItem('tokenExpiry');
    if (storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        refreshToken();
        return true;
      }
      // If token is already expired, logout
      else if (timeUntilExpiry <= 0) {
        logout();
        return false;
      }
    }
    return true;
  };

  // Login - requires MFA verification
  const login = (userData) => {
    const newToken = generateToken();
    setUser(userData);
    setToken(newToken);
    const expiry = Date.now() + 60 * 60 * 1000;
    setTokenExpiry(expiry);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', newToken);
    localStorage.setItem('tokenExpiry', expiry.toString());
  };

  // Signup - requires MFA verification
  const signup = (userData) => {
    const newToken = generateToken();
    setUser(userData);
    setToken(newToken);
    const expiry = Date.now() + 60 * 60 * 1000;
    setTokenExpiry(expiry);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', newToken);
    localStorage.setItem('tokenExpiry', expiry.toString());
  };

  // Logout
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setToken(null);
    setTokenExpiry(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
  };

  // Initial authentication check
  const checkAuth = () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedExpiry = localStorage.getItem('tokenExpiry');

    if (storedUser && storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      if (expiryTime > Date.now()) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setTokenExpiry(expiryTime);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    token,
    tokenExpiry,
    login,
    signup,
    logout,
    checkAuth,
    refreshToken,
    checkAndRefreshToken,
    generateToken,
  };
};
