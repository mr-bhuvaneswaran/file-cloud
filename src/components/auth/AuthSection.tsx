import { useState } from 'react';
import SignUpForm from './SignUpForm';
import LoginForm from './LoginForm';

interface AuthSectionProps {
  onLoginSuccess?: () => void;
}

export default function AuthSection({ onLoginSuccess }: AuthSectionProps) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  return (
    <div className="w-full max-w-md p-8 rounded-xl shadow-xl bg-white/80 backdrop-blur-md">
      {mode === 'signup' ? (
        <>
          <SignUpForm onSignUpSuccess={() => { setMode('login'); setShowLoginMessage(true); }} />
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <button className="text-purple-600 font-semibold hover:underline" onClick={() => setMode('login')}>Log in</button>
          </div>
        </>
      ) : (
        <>
          {showLoginMessage && (
            <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-center text-sm font-medium">
              Sign up successful! You can now log in.
            </div>
          )}
          <LoginForm onLoginSuccess={onLoginSuccess} />
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <button className="text-pink-600 font-semibold hover:underline" onClick={() => { setMode('signup'); setShowLoginMessage(false); }}>Sign up</button>
          </div>
        </>
      )}
    </div>
  );
} 