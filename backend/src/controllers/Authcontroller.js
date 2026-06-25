// backend/src/controllers/authController.js
// Tầng CONTROLLER: chứa toàn bộ logic nghiệp vụ xác thực.
// Nhiệm vụ: validate input → gọi repository → xử lý → trả Response.
// Không được viết SQL trực tiếp ở đây — mọi DB call đi qua repository.

const { getUserByUsername, getUser } = require('../repositories/userRepository')
const { hashPassword, verifyPassword } = require('../utils/passwordUtils')
const { signToken }                    = require('../utils/jwtUtils')

// ─────────────────────────────────────────────────────────────
//  Hằng số thông báo lỗi — dùng chung để dễ chỉnh sửa sau này
// ─────────────────────────────────────────────────────────────
const ERR = {
  MISSING_FIELDS:    'Username and password are required.',
  USERNAME_INVALID:  'Username must be 3–50 characters and contain no special characters.',
  PASSWORD_TOO_SHORT: 'Password must be at least 4 characters.',
  USER_NOT_FOUND:    'User not found.',
  ACCOUNT_DISABLED:  'Account is disabled.',
  NO_PASSWORD:       'No password set for this user.',
  WRONG_PASSWORD:    'Invalid credentials.',
  SERVER_ERROR:      'Internal server error.',
}

// ─────────────────────────────────────────────────────────────
//  VALIDATE HELPERS
// ─────────────────────────────────────────────────────────────

/** Kiểm tra username: 3-50 ký tự, chỉ chữ cái/số/dấu gạch dưới */
function isValidUsername(username) {
  return typeof username === 'string'
    && username.length >= 3
    && username.length <= 50
    && /^[a-zA-Z0-9_]+$/.test(username)
}

/** Kiểm tra password: ít nhất 4 ký tự */
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 4
}

// ─────────────────────────────────────────────────────────────
//  LOGIN
//  POST /api/auth/login
//  Body: { username: string, password: string, remember?: boolean }
// ─────────────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { username, password, remember = false } = req.body

    // ── 1. Kiểm tra dữ liệu đầu vào ─────────────────────────
    if (!username || !password) {
      return res.status(400).json({ message: ERR.MISSING_FIELDS })
    }

    const trimmedUsername = username.trim()

    if (!isValidUsername(trimmedUsername)) {
      return res.status(400).json({ message: ERR.USERNAME_INVALID })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ message: ERR.PASSWORD_TOO_SHORT })
    }

    // ── 2. Tìm user trong DB ──────────────────────────────────
    const user = await getUserByUsername(trimmedUsername)
    if (!user) {
      // Dùng thông báo chung để tránh lộ thông tin user có tồn tại không
      return res.status(401).json({ message: ERR.WRONG_PASSWORD })
    }

    // ── 3. Kiểm tra tài khoản active ─────────────────────────
    if (user.status === 0) {
      return res.status(403).json({ message: ERR.ACCOUNT_DISABLED })
    }

    // ── 4. Kiểm tra mật khẩu đã được set chưa ────────────────
    if (!user.hashed_password || !user.salt) {
      return res.status(401).json({ message: ERR.NO_PASSWORD })
    }

    // ── 5. So sánh mật khẩu (PBKDF2 + timingSafeEqual) ───────
    const isMatch = verifyPassword(password, user.salt, user.hashed_password)
    if (!isMatch) {
      return res.status(401).json({ message: ERR.WRONG_PASSWORD })
    }

    // ── 6. Tạo JWT token ──────────────────────────────────────
    const payload = {
      id:        user.id,
      username:  user.name,
      full_name: user.full_name || null,
      role_id:   user.role_id,
      role_name: user.role_name || '',
    }
    const token = signToken(payload, !!remember)

    // ── 7. Trả về response (không trả password/salt) ──────────
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: payload,
    })
  } catch (err) {
    console.error('[AuthController] login error:', err)
    return res.status(500).json({ message: ERR.SERVER_ERROR })
  }
}

// ─────────────────────────────────────────────────────────────
//  LOGOUT
//  POST /api/auth/logout
//  JWT là stateless — backend không lưu session.
//  Frontend chịu trách nhiệm xoá token khỏi localStorage.
// ─────────────────────────────────────────────────────────────
function logout(_req, res) {
  return res.status(200).json({ message: 'Logged out successfully.' })
}

// ─────────────────────────────────────────────────────────────
//  GET ME
//  GET /api/auth/me
//  Lấy thông tin user đang đăng nhập từ DB (dùng id từ JWT payload)
//  Đảm bảo data luôn mới nhất, không chỉ dựa vào token cũ
// ─────────────────────────────────────────────────────────────
async function getMe(req, res) {
  try {
    const user = await getUser(req.user.id)
    if (!user) {
      return res.status(404).json({ message: ERR.USER_NOT_FOUND })
    }

    // Loại bỏ các trường nhạy cảm trước khi trả về
    const { hashed_password, salt, ...safeUser } = user
    return res.status(200).json(safeUser)
  } catch (err) {
    console.error('[AuthController] getMe error:', err)
    return res.status(500).json({ message: ERR.SERVER_ERROR })
  }
}

module.exports = { login, logout, getMe }