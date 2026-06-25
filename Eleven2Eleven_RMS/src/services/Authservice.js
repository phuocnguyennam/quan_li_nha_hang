// frontend/src/services/authService.js
// Tầng SERVICE (frontend): trung gian giữa UI và backend API.
// Nhiệm vụ: đóng gói mọi HTTP call liên quan đến auth.
// Không chứa UI logic, không trực tiếp đụng localStorage token tại đây
// (localStorage được quản lý ở Login.jsx và AuthContext.jsx).

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// ─────────────────────────────────────────────────────────────
//  HELPER: gọi fetch và chuẩn hoá lỗi
//  Nếu backend trả về { message }, ném Error với message đó
//  để Login.jsx bắt được và hiển thị đúng thông báo
// ─────────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    // Ném lỗi với message từ backend → Login.jsx sẽ map sang tiếng Việt/Anh
    throw new Error(data.message || `HTTP ${response.status}`)
  }

  return data
}

// ─────────────────────────────────────────────────────────────
//  LOGIN
//  Gọi POST /api/auth/login
//  @returns {{ token: string, user: object }}
// ─────────────────────────────────────────────────────────────
export async function login(username, password, remember = false) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, remember }),
  })
}

// ─────────────────────────────────────────────────────────────
//  LOGOUT
//  Gọi POST /api/auth/logout (backend chỉ trả 200)
//  Xoá token khỏi localStorage thực hiện ở AuthContext
// ─────────────────────────────────────────────────────────────
export async function logout() {
  return apiFetch('/auth/logout', { method: 'POST' })
}

// ─────────────────────────────────────────────────────────────
//  GET ME
//  Lấy thông tin user đang đăng nhập (fresh từ DB)
//  Dùng trong AuthContext khi khởi động app để verify token còn sống
// ─────────────────────────────────────────────────────────────
export async function getMe() {
  return apiFetch('/auth/me')
}

export default { login, logout, getMe }