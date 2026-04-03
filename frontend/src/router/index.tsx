import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SkeletonCard } from '../components/skeletons/SkeletonCard';

const DashboardPage = lazy(
  () => import('../components/dashboard/DashboardPage')
);

const ActivityPage = lazy(
  () => import('../pages/ActivityPage')
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
        path="/"
        element={
          <Suspense fallback={<PageFallback />}>
            <DashboardPage />
          </Suspense>
        }
      />
      <Route
        path="/activity"
        element={
          <Suspense fallback={<PageFallback />}>
            <ActivityPage />
          </Suspense>
        }
      />
      <Route
        path="/dsa"
        element={
          <Suspense fallback={<PageFallback />}>
            <DsaPage />
          </Suspense>
        }
      />
      <Route
        path="/projects"
        element={
          <Suspense fallback={<PageFallback />}>
            <ProjectsPage />
          </Suspense>
        }
      />
      <Route
        path="/settings"
        element={
          <Suspense fallback={<PageFallback />}>
            <SettingsPage />
          </Suspense>
        }
      />
      <Route
        path="/profile"
        element={
          <Suspense fallback={<PageFallback />}>
            <SettingsPage />
          </Suspense>
        }
      />
    </Routes>
  );
};
