'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Root landing path of the application. Dispatches session checks
 * and routes dynamically.
 */
export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-lg font-medium animate-pulse">Redirecting to RedSpecter...</div>
    </div>
  );
}
