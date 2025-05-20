import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AtSymbolIcon, LockClosedIcon, ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
function validatePassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

export default function SignUpForm({ onSignUpSuccess }: { onSignUpSuccess?: () => void } = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const rePasswordRef = useRef<HTMLInputElement>(null);

  // Live validation
  const emailValid = validateEmail(email);
  const passwordValid = validatePassword(password);
  const passwordsMatch = password === rePassword && rePassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailValid) {
      setError('Please enter a valid email address.');
      emailRef.current?.focus();
      return;
    }
    if (!passwordValid) {
      setError('Password must be at least 8 characters, include a lowercase, uppercase, number, and symbol.');
      passwordRef.current?.focus();
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      rePasswordRef.current?.focus();
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setEmail('');
      setPassword('');
      setRePassword('');
      if (onSignUpSuccess) onSignUpSuccess();
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
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
            email.length > 0 && !emailValid ? 'border-pink-500 ring-pink-200' : 'border-gray-300 focus:ring-purple-200'
          )}
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && passwordRef.current?.focus()}
          required
        />
        {email.length > 0 && !emailValid && (
          <div className="flex items-center gap-2 text-pink-600 text-xs mt-1">
            <ExclamationCircleIcon className="w-4 h-4" /> Invalid email address
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 relative">
        <label htmlFor="password" className="font-semibold flex items-center gap-1">
          <LockClosedIcon className="w-5 h-5 text-purple-500" /> Password
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={clsx(
              'px-4 py-2 rounded border focus:outline-none focus:ring-2 transition w-full',
              password.length > 0 && !passwordValid ? 'border-pink-500 ring-pink-200' : 'border-gray-300 focus:ring-purple-200'
            )}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && rePasswordRef.current?.focus()}
            required
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
        {password.length > 0 && !passwordValid && (
          <div className="flex items-center gap-2 text-pink-600 text-xs mt-1">
            <ExclamationCircleIcon className="w-4 h-4" /> Password must be 8+ chars, 1 lowercase, 1 uppercase, 1 number, 1 symbol
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 relative">
        <label htmlFor="repassword" className="font-semibold flex items-center gap-1">
          <LockClosedIcon className="w-5 h-5 text-purple-400" /> Re-enter Password
        </label>
        <div className="relative">
          <input
            ref={rePasswordRef}
            id="repassword"
            type={showRePassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={clsx(
              'px-4 py-2 rounded border focus:outline-none focus:ring-2 transition w-full',
              rePassword.length > 0 && (!passwordsMatch || !passwordValid) ? 'border-pink-500 ring-pink-200' : 'border-gray-300 focus:ring-purple-200'
            )}
            value={rePassword}
            onChange={e => setRePassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
            required
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500"
            onClick={() => setShowRePassword(v => !v)}
            aria-label={showRePassword ? 'Hide password' : 'Show password'}
          >
            {showRePassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
        {rePassword.length > 0 && !passwordsMatch && (
          <div className="flex items-center gap-2 text-pink-600 text-xs mt-1">
            <ExclamationCircleIcon className="w-4 h-4" /> Passwords do not match
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-pink-600 text-sm">
          <ExclamationCircleIcon className="w-5 h-5" /> {error}
        </div>
      )}
      <button
        type="submit"
        className="w-full py-2 rounded bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-pink-200"
        disabled={loading || !emailValid || !passwordValid || !passwordsMatch}
      >
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
} 