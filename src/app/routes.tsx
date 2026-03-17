import { createBrowserRouter, redirect } from 'react-router-dom';
import { AppLayout } from '@/components/layout/Layout';
import { AuthGuard, GuestGuard } from '@/components/auth/AuthGuard';
import CopilotPage from '@/app/copilot/page';
import { FactoryPage } from '@/app/factory/page';
import FactoryDetailPage from '@/app/factory-detail/page';
import { BrainPage } from '@/app/brain/page';
import BrainAtomDetailPage from '@/app/brain/atom-detail/page';
import { PerformancePage } from '@/app/performance/page';
import ReportCenterPage from '@/app/performance/report/page';
import AlarmManagementPage from '@/app/performance/alarm/page';
import { ExpertPage } from '@/app/expert/page';
import { AgentsPage } from '@/app/agents/page';
import { SettingsPage } from '@/app/settings/page';
import NotFoundPage from '@/app/404/page';
import LoginPage from '@/app/login/page';

const router = createBrowserRouter([
  {
    path: '/',
    loader: () => redirect('/copilot'),
  },
  {
    path: '/login',
    element: (
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: 'copilot',
        element: <CopilotPage />,
      },
      {
        path: 'factory',
        element: <FactoryPage />,
      },
      {
        path: 'factory/:id',
        element: <FactoryDetailPage />,
      },
      {
        path: 'brain',
        element: <BrainPage />,
      },
      {
        path: 'brain/atom/:id',
        element: <BrainAtomDetailPage />,
      },
      {
        path: 'performance',
        element: <PerformancePage />,
      },
      {
        path: 'performance/report',
        element: <ReportCenterPage />,
      },
      {
        path: 'performance/alarm',
        element: <AlarmManagementPage />,
      },
      {
        path: 'expert',
        element: <ExpertPage />,
      },
      {
        path: 'agents',
        element: <AgentsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;