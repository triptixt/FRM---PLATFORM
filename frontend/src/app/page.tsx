'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#1E88E5] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-gray-500">Loading PayYantra FRM...</span>
      </div>
    </div>
  );
}

