import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { CloudIcon } from '@heroicons/react/24/solid';

export default function Header() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user as { email: string });
    });
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const firstLetter = user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className="flex items-center justify-between px-6 py-4 shadow bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <CloudIcon className="w-8 h-8 text-purple-500" />
        <span className="text-2xl font-bold text-purple-700 tracking-tight">File Cloud</span>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold flex items-center justify-center text-lg shadow hover:scale-105 transition-transform focus:outline-none"
          onClick={() => setShowMenu(v => !v)}
          aria-label="User menu"
        >
          {firstLetter}
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl py-2 z-20 animate-fade-in">
            <button
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-pink-50 rounded"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
} 