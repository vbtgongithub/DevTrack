import React, { useState } from 'react';
import { login, register, storeTokens } from '../services/authService';
import { useUserStore } from '../store/userStore';

interface LoginPageProps {
  onAuthSuccess: () => void;
}

type Mode = 'login' | 'register';

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((s) => s.setUser);

  const [form, setForm] = useState({
    emailOrUsername: '',
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await login(form.emailOrUsername, form.password);
      } else {
        result = await register(form.email, form.username, form.displayName, form.password);
      }
      storeTokens(result.tokens.accessToken, result.tokens.refreshToken);
      setUser(result.user);
      onAuthSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f0] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DevTrack</h1>
          <p className="text-sm text-gray-500 mt-1">Your developer progress tracker</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">
          {/* Tab toggle */}
          <div className="flex rounded-lg bg-orange-50 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <Field label="Display Name" type="text" value={form.displayName} onChange={set('displayName')} placeholder="Your full name" required />
                <Field label="Username" type="text" value={form.username} onChange={set('username')} placeholder="e.g. coder123" required />
                <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
              </>
            )}

            {mode === 'login' && (
              <Field label="Email or Username" type="text" value={form.emailOrUsername} onChange={set('emailOrUsername')} placeholder="Email or username" required />
            )}

            <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />

            {mode === 'register' && (
              <Field label="Confirm Password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" required />
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {loading
                ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, type, value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-400"
    />
  </div>
);
