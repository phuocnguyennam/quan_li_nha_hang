// frontend/src/App.jsx
import { Navigate, Routes, Route } from 'react-router-dom'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { OrderProvider }         from '@/contexts/OrderContext'
import RequireAuth               from '@/components/auth/RequireAuth'

import Side_Navbar           from '@/components/custom/Side_Navbar'
import Login                 from '@/pages/Login'
import Orders                from '@/pages/Order'
import UserManagement        from '@/pages/UserManagement'
import MenuManagement        from '@/pages/MenuManagement'
import EditRecipe            from '@/pages/EditRecipe'
import Kitchen               from '@/pages/Kitchen'
import IngredientManagement  from '@/pages/IngredientManagement'
import TableReservation      from '@/pages/TableReservation'
import TableInfo             from '@/pages/TableInfo'
import SeatingManagement     from '@/pages/SeatingManagement'
import PaymentDashboard      from '@/pages/PaymentDashboard'

import './App.css'

// ─────────────────────────────────────────────────────────────
//  HomeRedirect — tách ra ngoài App để không tạo lại mỗi render
//  Nếu đã đăng nhập  → vào /dashboard
//  Nếu chưa đăng nhập → hiển thị Login
// ─────────────────────────────────────────────────────────────
function HomeRedirect() {
  const { user, initialized } = useAuth()

  // Chờ AuthContext xác minh token với backend trước khi quyết định redirect
  if (!initialized) return null

  return user ? <Navigate to="/dashboard" replace /> : <Login />
}

// ─────────────────────────────────────────────────────────────
//  AppLayout — phần layout dùng useAuth nên phải nằm trong
//  <AuthProvider>. Side_Navbar ẩn khi chưa đăng nhập.
// ─────────────────────────────────────────────────────────────
function AppLayout() {
  const { user } = useAuth()

  return (
    <div className="flex flex-row h-auto min-h-screen">
      {/* Chỉ hiện navbar khi đã đăng nhập */}
      {user && <Side_Navbar />}

      <div className="flex-1 overflow-y-scroll">
        <Routes>
          {/* ── Public ─────────────────────────────────────── */}
          <Route path="/" element={<HomeRedirect />} />

          {/* ── Protected ──────────────────────────────────── */}
          <Route path="/dashboard"  element={<RequireAuth><PaymentDashboard /></RequireAuth>} />
          <Route path="/orders"     element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/kitchen"    element={<RequireAuth><Kitchen /></RequireAuth>} />

          <Route path="/menu"                       element={<RequireAuth><MenuManagement /></RequireAuth>} />
          <Route path="/menu/:productId/recipe"     element={<RequireAuth><EditRecipe /></RequireAuth>} />

          <Route path="/ingredients" element={<RequireAuth><IngredientManagement /></RequireAuth>} />

          <Route path="/seating"     element={<RequireAuth><SeatingManagement /></RequireAuth>} />
          <Route path="/reservation" element={<RequireAuth><TableReservation /></RequireAuth>} />
          <Route path="/table-info"  element={<RequireAuth><TableInfo /></RequireAuth>} />

          <Route path="/users"       element={<RequireAuth><UserManagement /></RequireAuth>} />

          {/* ── Fallback: route không tồn tại → về trang chủ ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  App root — chỉ chứa Providers bọc ngoài
// ─────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <AppLayout />
      </OrderProvider>
    </AuthProvider>
  )
}

export default App