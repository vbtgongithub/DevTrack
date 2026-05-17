import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonCard } from '../components/skeletons/SkeletonCard';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const DsaPage = lazy(() => import('../pages/DsaPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));

const skeletonVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const PageFallback: React.FC<{ useDashboardSkeleton?: boolean }> = ({ useDashboardSkeleton = false }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={skeletonVariants}
    transition={{ duration: 0.25 }}
  >
    {useDashboardSkeleton ? (
      <DashboardSkeleton />
    ) : (
      <div className="flex flex-col gap-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    )}
  </motion.div>
);

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ErrorBoundary pageName="Dashboard">
            <Suspense fallback={<PageFallback useDashboardSkeleton />}>
              <DashboardPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/dsa"
        element={
          <ErrorBoundary pageName="DSA Workspace">
            <Suspense fallback={<PageFallback />}>
              <DsaPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/profile"
        element={
          <ErrorBoundary pageName="Progress">
            <Suspense fallback={<PageFallback />}>
              <ProfilePage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/settings"
        element={
          <ErrorBoundary pageName="Settings">
            <Suspense fallback={<PageFallback />}>
              <SettingsPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/admin"
        element={
          <ErrorBoundary pageName="Admin">
            <Suspense fallback={<PageFallback />}>
              <AdminPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      {/* Legacy routes — consolidated into core surfaces */}
      <Route path="/projects" element={<Navigate to="/dsa" replace />} />
      <Route path="/goals" element={<Navigate to="/dashboard" replace />} />
      <Route path="/challenges" element={<Navigate to="/dashboard" replace />} />
      <Route path="/achievements" element={<Navigate to="/profile" replace />} />
      <Route path="/leaderboard" element={<Navigate to="/profile" replace />} />
      <Route path="/notifications" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
