// frontend/src/contexts/AuthContext.jsx
// Quản lý trạng thái xác thực toàn app.
// Không gọi DB trực tiếp — mọi call qua authService → backend.

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout, getMe } from '@/services/LoginService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [initialized, setInitialized] = useState(false)

  // ── Khởi tạo: kiểm tra cookie còn hợp lệ không ─────────────
  useEffect(() => {
    async function init() {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
      if (!isLoggedIn) {
        setInitialized(true)
        return
      }
      try {
        // Gọi GET /api/auth/me — nếu access token hết hạn → fetchInterceptor làm mới ngầm.
        const freshUser = await getMe()
        setUser(freshUser)
      } catch {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('authUser')
      } finally {
        setInitialized(true)
      }
    }
    init()

    // Đăng ký lắng nghe sự kiện đăng xuất khi session hết hạn hoàn toàn
    const handleAuthExpired = () => {
      setUser(null)
    }
    window.addEventListener('auth-expired', handleAuthExpired)
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
    }
  }, [])

  // ── Login ─────────────────────────────────────────────────
  // Đây là hàm duy nhất Login.jsx được gọi.
  // Toàn bộ việc ghi localStorage và setUser xảy ra ở đây.
  const login = useCallback(async (username, password, remember = false) => {
    const { user: authUser } = await apiLogin(username, password, remember)

    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('authUser', JSON.stringify(authUser))

    // setUser trước navigate → RequireAuth thấy user ngay
    setUser(authUser)
    return authUser
  }, [])

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await apiLogout() } catch { /* ignore */ }
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('authUser')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, initialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}