// frontend/src/pages/Login.jsx
// Tầng VIEW: chỉ hiển thị UI và gọi API qua authService.
// Không chứa logic xác thực — mọi xử lý đẩy xuống authService → backend.

import { useState, useEffect }   from "react"
import { useNavigate }            from "react-router-dom"
import { AlertCircle }            from "lucide-react"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input }                  from "@/components/ui/input"
import { Button }                 from "@/components/ui/button"
import { Checkbox }               from "@/components/ui/checkbox"
import { useAuth }                from "@/contexts/AuthContext"

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  // ── Tự động điền username nếu đã lưu "Remember Me" ──────────
  useEffect(() => {
    const saved = localStorage.getItem("rememberUsername")
    if (saved) setUsername(saved)
  }, [])

  // ── Validate phía client (UX) — backend vẫn validate lại ────
  function validate() {
    if (!username.trim()) {
      setError("Please enter your username.")
      return false
    }
    if (!password) {
      setError("Please enter your password.")
      return false
    }
    return true
  }

  // ── Xử lý submit form ────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    setError("")

    if (!validate()) return

    setLoading(true)
    try {
      // Gọi auth.login() trong AuthContext — hàm này:
      //   1. Gọi authService.login() → POST /api/auth/login
      //   2. Lưu token + authUser vào localStorage
      //   3. setUser(authUser) → toàn bộ app thấy user ngay lập tức
      await login(username.trim(), password, remember)

      // Xử lý "Remember Me" username (không liên quan đến auth state)
      if (remember) localStorage.setItem("rememberUsername", username.trim())
      else          localStorage.removeItem("rememberUsername")

      navigate("/dashboard")
    } catch (err) {
      // Hiển thị thông báo lỗi trả về từ backend
      const msg = err.message || ""

      if (msg.includes("not found") || msg.includes("exist")) {
        setError("Account does not exist in the system.")
      } else if (msg.includes("credentials") || msg.includes("password")) {
        setError("Incorrect password. Please try again.")
      } else if (msg.includes("disabled")) {
        setError("This account has been disabled.")
      } else {
        setError("Login failed. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Xoá lỗi khi người dùng bắt đầu sửa ─────────────────────
  function clearError() {
    if (error) setError("")
  }

  const inputErrorClass = error ? "border-red-500 focus:ring-red-500" : ""

  return (
    <main className="w-full max-w-lg mx-auto mt-10 p-6 border border-gray-300 rounded-lg shadow-md bg-white">
      <form onSubmit={handleLogin} noValidate>
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">
          Login
        </h1>

        {/* ── Thông báo lỗi ───────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <FieldSet>
          <FieldGroup>
            {/* ── Username ──────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearError() }}
                placeholder="Enter your username..."
                className={inputErrorClass}
                disabled={loading}
              />
            </Field>

            {/* ── Password ──────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError() }}
                placeholder="Enter your password..."
                className={inputErrorClass}
                disabled={loading}
              />
            </Field>

            {/* ── Remember Me ───────────────────────────────── */}
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(!!v)}
                disabled={loading}
              />
              <label htmlFor="remember" className="text-sm cursor-pointer select-none text-slate-600">
                Remember Me
              </label>
            </div>

            {/* ── Submit ────────────────────────────────────── */}
            <Button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </FieldGroup>
        </FieldSet>
      </form>
    </main>
  )
}

export default Login