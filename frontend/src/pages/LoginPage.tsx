import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';

type Mode = 'login' | 'register';

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  autoFocus?: boolean;
}

/* ─── Field Component ─── */
const Field: React.FC<FieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  required,
  autoFocus,
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      autoFocus={autoFocus}
      className={`
        w-full px-4 py-3.5 rounded-xl text-sm text-white
        bg-[#1E293B]/50 backdrop-blur-sm
        border transition-all duration-200 ease-out
        placeholder:text-gray-600
        outline-none
        ${error
          ? 'border-red-500/50 focus:border-red-500'
          : 'border-[#334155]/50 focus:border-indigo-500/50 hover:border-[#475569]'
        }
      `}
    />
    {error && (
      <p className="text-xs text-red-400 pl-1">{error}</p>
    )}
  </div>
);

/* ─── Spinner Component ─── */
const Spinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

/* ─── Main Component ─── */
export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const storeLogin = useUserStore((s) => s.login);
  const storeRegister = useUserStore((s) => s.register);

  const [form, setForm] = useState({
    emailOrUsername: '',
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (error) setError(null);
  };

  /* ─── Validation ─── */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (mode === 'login') {
      if (!form.emailOrUsername.trim()) errors.emailOrUsername = 'Email or username is required';
    } else {
      if (!form.displayName.trim()) errors.displayName = 'Display name is required';
      if (!form.username.trim()) errors.username = 'Username is required';
      else if (form.username.length < 3) errors.username = 'Username must be at least 3 characters';
      if (!form.email.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    }

    if (!form.password.trim()) {
      errors.password = 'Password is required';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register' && form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ─── Submit Handler ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await storeLogin(form.emailOrUsername, form.password);
      } else {
        await storeRegister(form.email, form.username, form.displayName, form.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Mode Switch ─── */
  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setFieldErrors({});
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#0B1020]">
      {/* ─── Background Effects ─── */}
      <div className="absolute inset-0 bg-[#0B1020]" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.015%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

      {/* ─── Card Container ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* ─── Branding ─── */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-4"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-3xl font-bold text-white tracking-tight"
          >
            DevTrack
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm text-gray-500 mt-2"
          >
            Your developer journey, elevated.
          </motion.p>
        </div>

        {/* ─── Glass Card ─── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="rounded-3xl p-8 bg-[#111827]/80 backdrop-blur-xl border border-[#1E293B]/50 shadow-2xl shadow-black/20"
        >
          {/* ─── Tab Toggle ─── */}
          <div className="flex rounded-xl bg-[#1E293B]/50 backdrop-blur-sm p-1 mb-7">
            {(['login', 'register'] as Mode[]).map((m) => (
              <motion.button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`
                  flex-1 py-2.5 text-sm font-medium rounded-lg
                  transition-all duration-300 ease-out
                  relative overflow-hidden
                  ${mode === m
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
                whileTap={{ scale: 0.98 }}
              >
                {mode === m && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{m === 'login' ? 'Sign In' : 'Create Account'}</span>
              </motion.button>
            ))}
          </div>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <Field
                    id="ag-displayName"
                    label="Display Name"
                    type="text"
                    value={form.displayName}
                    onChange={set('displayName')}
                    placeholder="Your full name"
                    error={fieldErrors.displayName}
                    required
                  />
                  <Field
                    id="ag-username"
                    label="Username"
                    type="text"
                    value={form.username}
                    onChange={set('username')}
                    placeholder="e.g. coder123"
                    error={fieldErrors.username}
                    required
                  />
                  <Field
                    id="ag-email"
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@example.com"
                    error={fieldErrors.email}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'login' && (
              <Field
                id="ag-emailOrUsername"
                label="Email or Username"
                type="text"
                value={form.emailOrUsername}
                onChange={set('emailOrUsername')}
                placeholder="Email or username"
                error={fieldErrors.emailOrUsername}
                autoFocus
                required
              />
            )}

            <Field
              id="ag-password"
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              error={fieldErrors.password}
              required
            />

            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Field
                    id="ag-confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder="••••••••"
                    error={fieldErrors.confirmPassword}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Global Error ─── */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/20 px-4 py-3"
              >
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-300 leading-snug">{error}</p>
              </motion.div>
            )}

            {/* ─── Submit Button ─── */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                w-full py-3.5 px-4 mt-2
                bg-gradient-to-r from-indigo-500 to-purple-600
                hover:from-indigo-600 hover:to-purple-700
                disabled:from-indigo-400 disabled:to-purple-400 disabled:cursor-not-allowed
                text-white font-semibold text-sm
                rounded-xl
                shadow-lg shadow-indigo-500/20
                hover:shadow-indigo-500/30
                transition-all duration-300 ease-out
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>{mode === 'login' ? 'Signing in…' : 'Creating account…'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </motion.button>
          </form>

          {/* ─── Footer Link ─── */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </motion.div>

        {/* ─── Subtle Brand Footer ─── */}
        <p className="text-center text-xs text-gray-600 mt-6 tracking-wider">
          DEVTRACK &middot; TRACK &middot; BUILD &middot; SHIP
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;