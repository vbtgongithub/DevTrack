import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonCard } from '../components/skeletons/SkeletonCard';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

const DashboardPage = lazy(
  () => import('../pages/DashboardPage')
);

const DsaPage = lazy(
  () => import('../pages/DsaPage')
);

const ProjectsPage = lazy(
  () => import('../pages/ProjectsPage')
);

const SettingsPage = lazy(
  () => import('../pages/SettingsPage')
);

const ProfilePage = lazy(
  () => import('../pages/ProfilePage')
);

// ─── Page Fallback Variants ───
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
      <div className="px-6 py-6 flex flex-col gap-4">
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
          <ErrorBoundary pageName="DSA Tracker">
            <Suspense fallback={<PageFallback />}>
              <DsaPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/projects"
        element={
          <ErrorBoundary pageName="Projects">
            <Suspense fallback={<PageFallback />}>
              <ProjectsPage />
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
        path="/profile"
        element={
          <ErrorBoundary pageName="Profile">
            <Suspense fallback={<PageFallback />}>
              <ProfilePage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
