// frontend/src/pages/UserManagement.jsx
// Nhiệm vụ: UI thuần — render state, dispatch user action → delegate xuống service
// Không chứa logic axios/fetch, không chứa normalizeUser, không hash password trực tiếp

import { useMemo, useState, useEffect } from 'react'
import UserLayout      from '@/components/custom/User'
import RoleCombobox    from '@/components/custom/RoleCombobox'
import { Button }      from '@/components/ui/button'
import { Input }       from '@/components/ui/input'
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group'
import { Search } from 'lucide-react'

import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from '@/services/UserManagementService'

// ── Initial form state ────────────────────────────────────────
const EMPTY_FORM = { username: '', name: '', email: '', password: '', role_id: '' }

export default function UserManagement() {
  const [query,   setQuery]   = useState('')
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const [showAdd, setShowAdd] = useState(false)
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)

  // ── Load users on mount ─────────────────────────────────────
  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      setError(null)
      const list = await fetchUsers()
      setUsers(list)
    } catch (err) {
      console.error('Failed to load users', err)
      setError('Không thể tải danh sách user. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // ── Search & sort ────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users
      .filter(u => {
        if (!q) return true
        return (
          u.name.toLowerCase().includes(q)     ||
          u.email.toLowerCase().includes(q)    ||
          u.role.toLowerCase().includes(q)     ||
          u.username.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const roleCmp = a.role.toLowerCase().localeCompare(b.role.toLowerCase())
        return roleCmp !== 0 ? roleCmp : a.name.localeCompare(b.name)
      })
  }, [query, users])

  // ── Helpers ──────────────────────────────────────────────────
  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setShowAdd(false)
  }

  // ── Add user ──────────────────────────────────────────────────
  async function handleSaveNew() {
    const { username, name, email, password, role_id } = form
    console.log(role_id)
    if (!username.trim() || !name.trim() || !email.trim() || !password.trim()) {
      alert('Vui lòng điền đầy đủ username, full name, email và password.')
      return
    }

    try {
      setSaving(true)
      const created = await createUser({
        name:      username.trim(),
        full_name: name.trim(),
        email:     email.trim(),
        password:  password.trim(),
        role_id:   role_id !== '' && role_id != null ? Number(role_id) : undefined,
        status:    1,
      })
      setUsers(prev => [created, ...prev])
      resetForm()
    } catch (err) {
      // fetch wrapper ném Error với .message từ server (không có .response)
      alert(err.message || 'Tạo user thất bại.')
    } finally {
      setSaving(false)
    }
  }

  // ── Update user ───────────────────────────────────────────────
  async function handleUpdateUser(id, updated) {
    try {
      const saved = await updateUser(id, updated)
      setUsers(prev => prev.map(u => (u.id === id ? saved : u)))
    } catch (err) {
      alert(err.message || 'Cập nhật user thất bại.')
    }
  }

  // ── Delete user ───────────────────────────────────────────────
  async function handleDeleteUser(id) {
    if (!confirm('Xóa user này? Hành động không thể hoàn tác.')) return
    try {
      await deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      alert(err.message || 'Xóa user thất bại.')
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <main className="p-8 flex-1 bg-gray-100 min-h-screen w-full">
      <h1 className="text-3xl font-bold mb-4">User Management</h1>

      {/* Search + Add button */}
      <div className="flex flex-row mb-4 justify-between items-center gap-4">
        <InputGroup className="w-full h-12 border-gray-400">
          <InputGroupInput
            className="text-lg"
            placeholder="Tìm theo tên, email, role..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <Button
          className="h-12 text-lg px-5 bg-green-100 hover:bg-emerald-200 border border-green-500"
          onClick={() => setShowAdd(s => !s)}
        >
          {showAdd ? 'Đóng' : 'Thêm user'}
        </Button>
      </div>

      {/* Add user form */}
      {showAdd && (
        <div className="mb-6 rounded-md border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3">
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(e) => updateForm('username', e.target.value)}
            />
            <Input
              placeholder="Họ tên đầy đủ"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
            />
            <Input
              placeholder="Mật khẩu"
              type="password"
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
            />
            <RoleCombobox
              className="w-full"
              value={form.role_id}
              onChange={(v) => updateForm('role_id', v)}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary"  className="px-4" onClick={handleSaveNew} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <Button variant="ghost" className="px-4" onClick={resetForm}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* User list */}
      {loading && <p className="text-sm text-gray-500">Đang tải danh sách user...</p>}
      {error   && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && filteredUsers.length === 0 && (
        <p className="text-sm text-gray-500">Không tìm thấy user nào.</p>
      )}

      {!loading && filteredUsers.map(user => (
        <UserLayout
          key={user.id}
          user={user}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
        />
      ))}
    </main>
  )
}