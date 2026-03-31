'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function getLandingPage(role?: string, businessType?: string): string {
  if ((role === 'chef' || role === 'cook') && businessType === 'restaurant') return '/kds';
  return '/pos';
}

const PUBLIC_PATHS = ['/kds', '/auth/login', '/auth/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, currentTenant, loading, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some(p => pathname === p || pathname?.startsWith(p + '/'));

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isPublicPath) return;
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!currentTenant) {
        router.push('/auth/login?select_tenant=true');
      }
    }
  }, [user, currentTenant, loading, router, pathname, isPublicPath]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !currentTenant) return null;

  return <>{children}</>;
}
