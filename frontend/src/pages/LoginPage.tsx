import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

type Mode = 'login' | 'register';

// ─── Defer framer-motion layoutId animations past hydration ───────────────
const MotionShield: React.FC<{ children: React.ReactNode; className?: string; active?: boolean }> = ({
  children,
  className,
  active = false,
}) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready || !active) return <div className={className}>{children}</div>;
  return <motion.div className={className}>{children}</motion.div>;
};

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
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="space-y-1.5 relative group">
      <label htmlFor={id} className="block text-[13px] font-bold text-dt-text tracking-tight">
        {label}
        {required && <span className="text-dt-primary ml-1" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            w-full px-4 py-3.5 rounded-xl text-[14px] text-dt-text font-bold
            bg-dt-elevated 
            border transition-all duration-300 ease-out
            placeholder:text-dt-textMuted placeholder:font-medium
            outline-none
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-white'
              : 'border-dt-primary/5 hover:border-dt-primary/10 focus:border-dt-primary focus:ring-4 focus:ring-dt-primary/10 bg-dt-elevated focus:bg-dt-surface'
            }
            ${isPassword ? 'pr-12' : ''}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-dt-textMuted hover:text-dt-text transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            id={`${id}-error`}
            className="text-[13px] text-red-500 font-bold pl-1 m-0 absolute -bottom-5"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Spinner Component ─── */
const Spinner: React.FC = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

/* ─── Main Component ─── */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
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
      // Navigate to dashboard after successful auth
      navigate('/dashboard');
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
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-dt-bg font-sans selection:bg-dt-primary/15 selection:text-dt-text">
      {/* ─── Background Effects ─── */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay z-0" />
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-dt-primary/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-dt-secondary/10 rounded-full blur-[100px]"
      />

      {/* ─── Card Container ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* ─── Branding ─── */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-[18px] bg-dt-surface border border-dt-primary/10 shadow-dt-glow mb-6"
          >
            <svg className="w-6 h-6 text-dt-text" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-[32px] font-bold text-dt-text tracking-tight leading-tight"
          >
            Welcome to DevTrack
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[15px] text-dt-textSecondary mt-2 font-medium"
          >
            Log in to continue your developer journey.
          </motion.p>
        </div>

        {/* ─── Soft Card ─── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative rounded-[28px] p-8 sm:p-10 dt-card bg-dt-surface border border-dt-primary/10 shadow-sm"
        >
          {/* ─── Tab Toggle ─── */}
          <div className="flex rounded-2xl bg-dt-bg p-1.5 mb-8 border border-dt-primary/5">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`
                  flex-1 py-2.5 text-[14px] font-bold rounded-xl
                  transition-all duration-300 ease-out
                  relative overflow-hidden
                  ${mode === m
                    ? 'text-dt-text shadow-sm'
                    : 'text-dt-textSecondary hover:text-dt-text'
                  }
                `}
              >
                {mode === m && (
                  <MotionShield
                    active
                    className="absolute inset-0 bg-dt-surface rounded-xl border border-dt-primary/5"
                  >
                    <div className="absolute inset-0 bg-dt-surface rounded-xl border border-dt-primary/5" />
                  </MotionShield>
                )}
                <span className="relative z-10">{m === 'login' ? 'Sign In' : 'Create Account'}</span>
              </button>
            ))}
          </div>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
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
                  className="pt-2"
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
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3"
                >
                  <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-[14px] font-bold text-red-600 leading-snug">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Submit Button ─── */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01, translateY: -1 }}
              whileTap={{ scale: 0.98 }}
              className="
                w-full py-3.5 px-4 mt-4
                bg-gradient-to-r from-dt-primary to-dt-secondary hover:bg-[position:100%_0] bg-[length:200%_auto]
                disabled:opacity-70 disabled:cursor-not-allowed
                text-white font-bold text-[15px]
                rounded-[14px]
                shadow-lg shadow-dt-primary/20
                hover:shadow-dt-primary/30
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
        </motion.div>

        {/* ─── Footer Link ─── */}
        <p className="text-center text-[14px] text-dt-textSecondary mt-8 font-medium">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-bold text-dt-text hover:text-dt-primary transition-colors duration-200 underline decoration-dt-primary/10 underline-offset-4 hover:decoration-dt-primary/40"
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
                className="font-bold text-dt-text hover:text-dt-primary transition-colors duration-200 underline decoration-dt-primary/10 underline-offset-4 hover:decoration-dt-primary/40"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {/* ─── Subtle Brand Footer ─── */}
        <p className="text-center text-[11px] text-dt-textMuted mt-10 font-bold tracking-widest uppercase">
          DEVTRACK
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;