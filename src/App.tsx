import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';
import HomePage from '@/pages/HomePage';
import FamilyTreePage from '@/pages/FamilyTreePage';
import MembersPage from '@/pages/MembersPage';
import MemberProfilePage from '@/pages/MemberProfilePage';
import FamilyHistoryPage from '@/pages/FamilyHistoryPage';
import GalleryPage from '@/pages/GalleryPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminMembersPage from '@/pages/admin/AdminMembersPage';
import AdminMemberForm from '@/pages/admin/AdminMemberForm';
import AdminGalleryPage from '@/pages/admin/AdminGalleryPage';
import AdminHistoryPage from '@/pages/admin/AdminHistoryPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminFoundersSetup from '@/pages/admin/AdminFoundersSetup';
import PublicContributePage from '@/pages/PublicContributePage';
import InviteGeneratorPage from '@/pages/admin/InviteGeneratorPage';
import AdminReviewPage from '@/pages/admin/AdminReviewPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
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
