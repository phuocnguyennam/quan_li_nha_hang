// backend/src/routes/tableRoutes.js
const express = require('express')
const router  = express.Router()

const { requireAuth, requireRole } = require('../middlewares/authMiddleware')
const ctrl = require('../controllers/Tablecontroller.js')

// Tất cả route đều cần đăng nhập
router.use(requireAuth)

// GET  /api/tables            – mọi role
// GET  /api/tables?status=... – lọc theo status
// GET  /api/tables?area_id=.. – lọc theo khu vực
router.get('/',    ctrl.listTables)

// GET  /api/tables/:id
router.get('/:id', ctrl.getTable)

// POST /api/tables            – manager / admin
router.post('/', requireRole('manager', 'admin'), ctrl.createTable)

// PUT  /api/tables/:id        – manager / admin
router.put('/:id', requireRole('manager', 'admin'), ctrl.updateTable)

// PATCH /api/tables/:id/status – staff trở lên (cập nhật trạng thái nhanh)
router.patch('/:id/status', requireRole('staff', 'manager', 'admin'), ctrl.updateTableStatus)

// DELETE /api/tables/:id      – admin only
router.delete('/:id', requireRole('admin'), ctrl.deleteTable)

module.exports = router