import { memo } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { PageTransition } from '../PageTransition'

export const AdminLayout = memo(function AdminLayout() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0612', backgroundImage: 'radial-gradient(ellipse at 80% 0%, rgba(99,40,217,0.12) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(6,182,212,0.08) 0%, transparent 55%)' }}>
      <AdminSidebar />
      <main className="ml-60 min-h-screen">
        <PageTransition>
          <div className="p-8">
            <Outlet />
          </div>
        </PageTransition>
      </main>
    </div>
  )
})

export default AdminLayout