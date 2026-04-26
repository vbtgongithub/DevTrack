import React, { useState } from 'react';
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
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[13px] font-semibold text-gray-600 tracking-wide">
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
        ag-input-glow
        w-full px-4 py-3 rounded-xl text-sm text-gray-900
        bg-white/70 backdrop-blur-sm
        border transition-all duration-200 ease-out
        placeholder:text-gray-400
        outline-none
        ${error
          ? 'border-red-300 focus:border-red-400'
          : 'border-gray-200/80 hover:border-orange-200 focus:border-orange-400'
        }
      `}
    />
    {error && (
      <p className="text-xs text-red-500 pl-1 animate-[dtFadeIn_300ms_ease-out]">{error}</p>
    )}
  </div>
);

/* ─── Spinner Component ─── */
const Spinner: React.FC = () => <span className="ag-spinner inline-block" />;

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
    // Clear field error on change
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
      if (!form.password) errors.password = 'Password is required';
    } else {
      if (!form.displayName.trim()) errors.displayName = 'Display name is required';
      if (!form.username.trim()) errors.username = 'Username is required';
      if (!form.email.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
      if (!form.password) errors.password = 'Password is required';
      else if (form.password.length < 6) errors.password = 'Must be at least 6 characters';
      if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ─── Submit ─── */
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
      // Auth gate in App.tsx will redirect on isAuthenticated change
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

  /* ─── Mode Switch ─── */
  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setFieldErrors({});
  };

  return (
    <div className="ag-bg relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* ─── Floating Background Orbs ─── */}
      <div
        className="ag-orb w-[420px] h-[420px] bg-orange-200"
        style={{ top: '10%', left: '15%', animationDelay: '0s' }}
      />
      <div
        className="ag-orb w-[320px] h-[320px] bg-amber-100"
        style={{ bottom: '15%', right: '10%', animationDelay: '4s' }}
      />
      <div
        className="ag-orb w-[200px] h-[200px] bg-rose-100"
        style={{ top: '50%', left: '60%', animationDelay: '8s' }}
      />

      {/* ─── Card Container ─── */}
      <div className="ag-card-float relative z-10 w-full max-w-[420px]">
        {/* ─── Branding ─── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-200/50 mb-4 transition-transform duration-300 hover:scale-110 hover:rotate-3">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">DevTrack</h1>
          <p className="text-sm text-gray-500 mt-1">Your developer progress, elevated.</p>
        </div>

        {/* ─── Glass Card ─── */}
        <div
          className="
            rounded-3xl p-8
            bg-white/60 backdrop-blur-xl
            border border-white/50
            shadow-[0_8px_32px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]
            transition-shadow duration-500
            hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)]
          "
        >
          {/* ─── Tab Toggle ─── */}
          <div className="flex rounded-xl bg-gray-100/60 backdrop-blur-sm p-1 mb-7">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`
                  flex-1 py-2 text-sm font-semibold rounded-lg
                  transition-all duration-300 ease-out
                  ${mode === m
                    ? 'bg-white text-gray-900 shadow-sm shadow-gray-200/50'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                <Field
                  id="ag-displayName"
                  label="DISPLAY NAME"
                  type="text"
                  value={form.displayName}
                  onChange={set('displayName')}
                  placeholder="Your full name"
                  error={fieldErrors.displayName}
                  required
                />
                <Field
                  id="ag-username"
                  label="USERNAME"
                  type="text"
                  value={form.username}
                  onChange={set('username')}
                  placeholder="e.g. coder123"
                  error={fieldErrors.username}
                  required
                />
                <Field
                  id="ag-email"
                  label="EMAIL"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  error={fieldErrors.email}
                  required
                />
              </>
            )}

            {mode === 'login' && (
              <Field
                id="ag-emailOrUsername"
                label="EMAIL OR USERNAME"
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
              label="PASSWORD"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              error={fieldErrors.password}
              required
            />

            {mode === 'register' && (
              <Field
                id="ag-confirmPassword"
                label="CONFIRM PASSWORD"
                type="password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="••••••••"
                error={fieldErrors.confirmPassword}
                required
              />
            )}

            {/* ─── Global Error ─── */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 px-4 py-3 animate-[dtFadeIn_400ms_ease-out]">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-700 leading-snug">{error}</p>
              </div>
            )}

            {/* ─── Submit Button ─── */}
            <button
              type="submit"
              disabled={loading}
              className="
                ag-btn-press
                w-full py-3 px-4 mt-2
                bg-gradient-to-r from-orange-500 to-orange-600
                hover:from-orange-600 hover:to-orange-700
                disabled:from-orange-300 disabled:to-orange-400 disabled:cursor-not-allowed
                text-white font-semibold text-sm
                rounded-xl
                shadow-md shadow-orange-200/40
                hover:shadow-lg hover:shadow-orange-300/40
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
            </button>
          </form>

          {/* ─── Footer Link ─── */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-semibold text-orange-600 hover:text-orange-700 transition-colors duration-200 hover:underline underline-offset-2"
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
                  className="font-semibold text-orange-600 hover:text-orange-700 transition-colors duration-200 hover:underline underline-offset-2"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* ─── Subtle Brand Footer ─── */}
        <p className="text-center text-xs text-gray-400 mt-6 tracking-wider">
          DEVTRACK &middot; TRACK &middot; BUILD &middot; SHIP
        </p>
      </div>
    </div>
  );
};
