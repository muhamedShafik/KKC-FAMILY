import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';
import HomePage from '@/pages/HomePage';

// Route-level code splitting for fast initial page loads
const FamilyTreePage = lazy(() => import('@/pages/FamilyTreePage'));
const MembersPage = lazy(() => import('@/pages/MembersPage'));
const MemberProfilePage = lazy(() => import('@/pages/MemberProfilePage'));
const FamilyHistoryPage = lazy(() => import('@/pages/FamilyHistoryPage'));
const GalleryPage = lazy(() => import('@/pages/GalleryPage'));
const PublicContributePage = lazy(() => import('@/pages/PublicContributePage'));

// Admin pages (lazy-loaded so regular visitors never download admin code)
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminMembersPage = lazy(() => import('@/pages/admin/AdminMembersPage'));
const AdminMemberForm = lazy(() => import('@/pages/admin/AdminMemberForm'));
const AdminGalleryPage = lazy(() => import('@/pages/admin/AdminGalleryPage'));
const AdminHistoryPage = lazy(() => import('@/pages/admin/AdminHistoryPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminFoundersSetup = lazy(() => import('@/pages/admin/AdminFoundersSetup'));
const InviteGeneratorPage = lazy(() => import('@/pages/admin/InviteGeneratorPage'));
const AdminReviewPage = lazy(() => import('@/pages/admin/AdminReviewPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="tree" element={<FamilyTreePage />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="members/:id" element={<MemberProfilePage />} />
                <Route path="history" element={<FamilyHistoryPage />} />
                <Route path="gallery" element={<GalleryPage />} />
              </Route>

              {/* Public Contributor Portal – token-protected */}
              <Route path="contribute" element={<PublicContributePage />} />

              {/* Admin auth */}
              <Route path="admin/login" element={<AdminLoginPage />} />

              {/* Admin protected */}
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="setup-founders" element={<AdminFoundersSetup />} />
                <Route path="members" element={<AdminMembersPage />} />
                <Route path="members/add" element={<AdminMemberForm />} />
                <Route path="members/:id/edit" element={<AdminMemberForm />} />
                <Route path="gallery" element={<AdminGalleryPage />} />
                <Route path="history" element={<AdminHistoryPage />} />
                <Route path="review" element={<AdminReviewPage />} />
                <Route path="invite-links" element={<InviteGeneratorPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c1917',
              color: '#fafaf9',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#c8871f', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
