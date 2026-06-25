// frontend/src/services/userManagementService.js
// Nhiệm vụ: đóng gói toàn bộ logic giao tiếp với /api/users
// Component chỉ gọi các hàm này — không gọi fetch trực tiếp trong component.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// ── fetch wrapper ─────────────────────────────────────────────
// Tự động gắn token, parse JSON, throw lỗi có message từ server.

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token')

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // Token hết hạn hoặc không hợp lệ → về trang login
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    return
  }

  // 204 No Content (DELETE thành công) — không có body để parse
  if (res.status === 204) return null

  const data = await res.json()

  if (!res.ok) {
    // Ném lỗi kèm message từ server để component hiển thị
    const err = new Error(data?.message || `HTTP ${res.status}`)
    err.status = res.status
    err.data   = data
    throw err
  }

  return data
}

// ── Shape normalizer ──────────────────────────────────────────
// Chuyển shape DB → shape component cần. Tập trung 1 chỗ, không rải khắp component.

function normalizeUser(u) {
  return {
    id:      u.id,
    username: u.name      || '',
    name:    u.full_name  || u.name || '',
    email:   u.email      || '',
    role:    u.role_name  || (u.role_id ? String(u.role_id) : ''),
    role_id: u.role_id != null ? String(u.role_id) : null,
    status:  u.status     ?? 1,
  }
}

// ── Public API ────────────────────────────────────────────────

/** Lấy toàn bộ danh sách users */
export async function fetchUsers() {
  const data = await apiFetch('/api/users')
  return data.map(normalizeUser)
}

/** Lấy một user theo id */
export async function fetchUser(id) {
  const data = await apiFetch(`/api/users/${id}`)
  return normalizeUser(data)
}

/**
 * Tạo user mới
 * @param {{ name, full_name, email, password, role_id, status? }} payload
 */
export async function createUser(payload) {
  const data = await apiFetch('/api/users', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
  return normalizeUser(data)
}

/**
 * Cập nhật user
 * @param {number} id
 * @param {{ name?, full_name?, email?, password?, role_id?, status? }} payload
 */
export async function updateUser(id, payload) {
  const data = await apiFetch(`/api/users/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(payload),
  })
  return normalizeUser(data)
}

/** Xóa user — trả về null (204 No Content) */
export async function deleteUser(id) {
  return apiFetch(`/api/users/${id}`, { method: 'DELETE' })
}

/** Lấy danh sách roles (dùng cho RoleCombobox) */
export async function fetchRoles() {
  const data = await apiFetch('/api/roles')
  return data.map(r => ({ id: String(r.id), name: r.name || String(r.id) }))
}