'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Route protection wrapper component. Verifies standard login session state
 * and redirects to the login screen if unauthenticated.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when authorized
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-lg font-medium animate-pulse">Loading RedSpecter Session...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};
