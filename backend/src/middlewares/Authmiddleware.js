// backend/src/middlewares/authMiddleware.js
// Tầng MIDDLEWARE: chỉ kiểm tra trung gian.
// Nhiệm vụ duy nhất: xác thực JWT token và kiểm tra Role.
// Không chứa logic nghiệp vụ, không gọi DB trực tiếp.

const { verifyToken } = require('../utils/jwtUtils')

// ─────────────────────────────────────────────────────────────
//  requireAuth — xác thực JWT token
//  Đọc token từ header: Authorization: Bearer <token>
//  Nếu hợp lệ → gắn req.user và gọi next()
// ─────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded   // { id, username, full_name, role_id, role_name, iat, exp }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token expired.' })
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token.' })
  }
}

// ─────────────────────────────────────────────────────────────
//  requireRole — kiểm tra quyền truy cập theo role
//  Phải dùng sau requireAuth (cần req.user đã được gắn)
//
//  @param {...string} allowedRoles  VD: 'Admin', 'Manager'
//
//  @example
//  router.delete('/users/:id', requireAuth, requireRole('Admin'), controller.delete)
// ─────────────────────────────────────────────────────────────
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' })
    }

    const roleName = (req.user.role_name || '').toLowerCase()
    const allowed  = allowedRoles.map(r => r.toLowerCase())

    if (allowed.includes(roleName)) {
      return next()
    }

    return res.status(403).json({
      message: `Forbidden: Required role(s): ${allowedRoles.join(', ')}.`,
    })
  }
}

module.exports = { requireAuth, requireRole }