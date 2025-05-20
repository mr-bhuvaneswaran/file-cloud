'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AboutSection from '../components/layout/AboutSection';
import AuthSection from '../components/auth/AuthSection';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        router.replace('/home');
      }
    });
  }, [router]);

  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="md:w-1/2 w-full flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-white relative overflow-hidden">
        <AboutSection />
      </div>
      <div className="md:w-1/2 w-full flex items-center justify-center bg-gradient-to-br from-white via-pink-100 to-purple-100 dark:from-white/90 dark:via-pink-50 dark:to-purple-50">
        <AuthSection onLoginSuccess={() => router.replace('/home')} />
      </div>
    </div>
  );
}
