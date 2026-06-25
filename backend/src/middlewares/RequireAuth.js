// middleware/requireAuth.js
// Dùng với Express.js

function isAllowed(roleName, pathname) {
  if (!roleName) return false
  const rn = roleName.toLowerCase()

  if (rn === 'admin') return true

  if (rn === 'manager') {
    if (pathname === '/users') return false
    return true
  }

  if (rn.includes('kitchen')) {
    return ['/orders', '/ingredients', '/kitchen'].some(p => pathname.startsWith(p))
  }

  if (rn === 'staff' || rn === 'waiter') {
    return ['/orders', '/reservation', '/table-info'].some(p => pathname.startsWith(p))
  }

  return false
}

/**
 * Middleware xác thực người dùng đã đăng nhập
 * Yêu cầu: req.user được gắn bởi middleware xác thực JWT/session trước đó
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: Please log in.' })
  }
  next()
}

/**
 * Middleware kiểm tra phân quyền theo role
 * @param {string} [routePath] - Nếu không truyền, dùng req.path tự động
 */
function requireRole(routePath) {
  return (req, res, next) => {
    const roleName = req.user?.roleName || req.user?.role || ''
    const pathname = routePath || req.path

    if (!isAllowed(roleName, pathname)) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized.' })
    }
    next()
  }
}

module.exports = { requireAuth, requireRole, isAllowed }