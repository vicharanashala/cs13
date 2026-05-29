import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { MiniZoro } from './components/MiniZoro'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const DoubtSolverPage = lazy(() => import('./pages/DoubtSolverPage'))
const ZoroPage = lazy(() => import('./pages/ZoroPage'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ModerationPage = lazy(() => import('./pages/admin/ModerationPage'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const ModLogs = lazy(() => import('./pages/admin/ModLogs'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center">
          <span className="text-[#7c3aed] text-xl">⚔</span>
        </div>
        <p className="text-white/30 text-sm">Loading...</p>
      </motion.div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
        exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/faq" element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
            <Route path="/doubts" element={<ProtectedRoute><DoubtSolverPage /></ProtectedRoute>} />
            <Route path="/zoro" element={<ProtectedRoute><ZoroPage /></ProtectedRoute>} />
            <Route path="/admin-x9k2" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="moderation" element={<ModerationPage />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="logs" element={<ModLogs />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function Layout() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <AnimatedRoutes />
  return (
    <>
      <Navbar />
      <AnimatedRoutes />
      <MiniZoro />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Cosmic starfield */}
        <div className="cosmic-bg"><div className="stars" /></div>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a24',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
            },
          }}
        />
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App