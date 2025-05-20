import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AtSymbolIcon, LockClosedIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      passwordRef.current?.focus();
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Login successful! Redirecting...');
      setEmail('');
      setPassword('');
      if (onLoginSuccess) onLoginSuccess();
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="font-semibold flex items-center gap-1">
          <AtSymbolIcon className="w-5 h-5 text-pink-500" /> Email
        </label>
        <input
          ref={emailRef}
          id="email"
          type="email"
          autoComplete="email"
          className={clsx(
            'px-4 py-2 rounded border focus:outline-none focus:ring-2 transition',
            error && !validateEmail(email) ? 'border-pink-500 ring-pink-200' : 'border-gray-300 focus:ring-purple-200'
          )}
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && passwordRef.current?.focus()}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="font-semibold flex items-center gap-1">
          <LockClosedIcon className="w-5 h-5 text-purple-500" /> Password
        </label>
        <input
          ref={passwordRef}
          id="password"
          type="password"
          autoComplete="current-password"
          className={clsx(
            'px-4 py-2 rounded border focus:outline-none focus:ring-2 transition',
            error && !password ? 'border-pink-500 ring-pink-200' : 'border-gray-300 focus:ring-purple-200'
          )}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
          required
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-pink-600 text-sm">
          <ExclamationCircleIcon className="w-5 h-5" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircleIcon className="w-5 h-5" /> {success}
        </div>
      )}
      <button
        type="submit"
        className="w-full py-2 rounded bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-pink-200"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
} 