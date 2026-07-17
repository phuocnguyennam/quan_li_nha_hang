// backend/src/routes/userRoutes.js
// Mount tại: /api/users (xem app.js)

const { Router }                   = require('express')
const { requireAuth, requireRole } = require('../../middlewares/Authmiddleware')
const ctrl                         = require('./UserController')

const router = Router()

// Tất cả routes yêu cầu đăng nhập
router.use(requireAuth)

// Admin và Manager: xem + tạo + sửa
const adminOrManager = requireRole('Admin', 'Manager')

// GET    /api/users        — Lấy danh sách
router.get   ('/',    adminOrManager, ctrl.listUsers)

// GET    /api/users/:id    — Lấy chi tiết
router.get   ('/:id', adminOrManager, ctrl.getUser)

// POST   /api/users        — Tạo user mới
router.post  ('/',    adminOrManager, ctrl.createUser)

// PUT    /api/users/:id    — Cập nhật user
router.put   ('/:id', adminOrManager, ctrl.updateUser)

// DELETE /api/users/:id    — Chỉ Admin mới được xóa
router.delete('/:id', requireRole('Admin'), ctrl.deleteUser)

module.exports = router