// frontend/src/components/auth/RequireAuth.jsx
// Bảo vệ route phía frontend — kiểm tra token + role từ AuthContext mới.
// Logic phân quyền thật sự vẫn nằm ở backend (authMiddleware.js).
// Component này chỉ làm UX: redirect hoặc hiển thị "không có quyền"
// thay vì để user thấy trang trắng khi backend trả 403.

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

// ─────────────────────────────────────────────────────────────
//  Bảng phân quyền theo route — đồng bộ với requireRole() ở backend
//  key  : pathname
//  value: mảng role_name được phép (lowercase)
// ─────────────────────────────────────────────────────────────
const ROUTE_ROLES = {
  '/dashboard':   ['admin', 'manager', 'staff', 'waiter', 'kitchen staff'],
  '/orders':      ['admin', 'manager', 'staff', 'waiter', 'kitchen staff'],
  '/users':       ['admin'],
  '/menu':        ['admin', 'manager'],
  '/ingredients': ['admin', 'manager', 'kitchen staff'],
  '/kitchen':     ['admin', 'manager', 'kitchen staff'],
  '/seating':     ['admin', 'manager'],
  '/reservation': ['admin', 'manager', 'staff', 'waiter'],
  '/table-info':  ['admin', 'manager', 'staff', 'waiter'],
}

/**
 * Kiểm tra user có quyền truy cập pathname không
 * Dùng startsWith để bắt các route động như /menu/123/recipe
 */
function isAllowed(roleName, pathname) {
  if (!roleName) return false
  const role = roleName.toLowerCase()

  // Admin luôn được phép tất cả
  if (role === 'admin') return true

  // Tìm entry khớp pathname (exact trước, sau đó prefix)
  const entry = Object.entries(ROUTE_ROLES).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )

  // Route không có trong bảng → mặc định cho phép (backend sẽ chặn nếu cần)
  if (!entry) return true

  return entry[1].includes(role)
}

export default function RequireAuth({ children }) {
  const { user, initialized } = useAuth()
  const location = useLocation()

  // Chờ AuthContext xác minh token với backend xong mới render
  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-slate-500">
        Loading...
      </div>
    )
  }

  // Chưa đăng nhập → redirect về trang login, lưu lại trang định vào
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Đã đăng nhập nhưng không đủ quyền
  const roleName = user.role_name || user.roleName || ''
  if (!isAllowed(roleName, location.pathname)) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-slate-500">
        You are not authorized to view this page.
      </div>
    )
  }

  return children
}