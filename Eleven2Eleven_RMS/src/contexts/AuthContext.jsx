// frontend/src/contexts/AuthContext.jsx
// Quản lý trạng thái xác thực toàn app.
// Không gọi DB trực tiếp — mọi call qua authService → backend.

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout, getMe } from '@/services/Authservice'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [initialized, setInitialized] = useState(false)

  // ── Khởi tạo: kiểm tra token còn hợp lệ không ─────────────
  useEffect(() => {
    async function init() {
      const token = localStorage.getItem('token')
      if (!token) {
        setInitialized(true)
        return
      }
      try {
        // Gọi GET /api/auth/me — nếu token hết hạn → backend trả 401 → catch
        const freshUser = await getMe()
        setUser(freshUser)
      } catch {
        // Token hết hạn hoặc không hợp lệ → clear hết
        localStorage.removeItem('token')
        localStorage.removeItem('authUser')
      } finally {
        setInitialized(true)
      }
    }
    init()
  }, [])

  // ── Login ─────────────────────────────────────────────────
  // Đây là hàm duy nhất Login.jsx được gọi.
  // Toàn bộ việc ghi localStorage và setUser xảy ra ở đây,
  // đảm bảo React state và localStorage luôn đồng bộ cùng lúc.
  const login = useCallback(async (username, password, remember = false) => {
    const { token, user: authUser } = await apiLogin(username, password, remember)

    localStorage.setItem('token', token)
    localStorage.setItem('authUser', JSON.stringify(authUser))

    // setUser trước navigate → RequireAuth thấy user ngay,
    // không cần reload hay init lại
    setUser(authUser)
    return authUser
  }, [])

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await apiLogout() } catch { /* ignore */ }
    localStorage.removeItem('token')
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