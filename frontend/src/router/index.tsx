import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SkeletonCard } from '../components/skeletons/SkeletonCard';
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


const PageFallback: React.FC = () => (
  <div className="px-6 py-6 flex flex-col gap-4">
    <SkeletonCard lines={2} />
    <SkeletonCard lines={4} />
    <SkeletonCard lines={3} />
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <ErrorBoundary pageName="Dashboard">
            <Suspense fallback={<PageFallback />}>
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
