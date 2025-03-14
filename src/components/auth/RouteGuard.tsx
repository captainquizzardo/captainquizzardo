'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (requireAdmin && !user.isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, requireAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (requireAdmin && !user.isAdmin)) {
    return null;
  }

  return <>{children}</>;
}
