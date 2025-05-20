'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Header from '../../components/drive/Header';
import DriveExplorer from '../../components/drive/DriveExplorer';

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login');
      } else {
        setIsAuthenticated(true);
      }
      setCheckingAuth(false);
    });
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-purple-500 text-lg font-bold animate-pulse">Checking authentication...</div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-purple-50">
      <Header />
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <DriveExplorer />
      </div>
    </div>
  );
}
