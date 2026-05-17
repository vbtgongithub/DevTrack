import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ToastContainer } from './components/shared/ToastContainer';
import { AppShell } from './components/layout/AppShell';
import { AppProviders } from './providers/AppProviders';
import { useUserStore } from './store/userStore';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { AppRouter } from './router';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { springCalm } from './lib/motion';

const BootSplash: React.FC = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={springCalm}
    className="min-h-screen flex items-center justify-center bg-[#0a0a0b]"
  >
    <div className="flex flex-col items-center gap-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, ...springCalm }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </motion.div>
      <motion.span 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...springCalm }}
        className="text-sm font-medium text-zinc-400 tracking-wide"
      >
        Loading DevTrack…
      </motion.span>
    </div>
  </motion.div>
);

const AuthGate: React.FC = () => {
  const status = useUserStore((s) => s.status);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const hydrate = useUserStore((s) => s.hydrate);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setHydrated(true);
    }, 8000);

    hydrate()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          clearTimeout(timeout);
          setHydrated(true);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [hydrate]);

  if (!hydrated || status === 'idle' || status === 'loading') {
    return <BootSplash />;
  }

  return (
    <ErrorBoundary pageName="App">
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />}>
          <Route path="/*" element={<AppRouter />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <ToastContainer />
        <AuthGate />
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
