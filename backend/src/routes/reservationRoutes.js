// backend/src/routes/reservationRoutes.js
const express = require('express')
const router  = express.Router()

const { requireAuth, requireRole } = require('../middlewares/authMiddleware')
const ctrl = require('../controllers/reservationController')

// Tất cả route đều cần đăng nhập
router.use(requireAuth)

// GET  /api/reservations          – mọi role đều đọc được
// GET  /api/reservations?date=...  – lọc theo ngày
router.get('/',    ctrl.listReservations)

// GET  /api/reservations/:id
router.get('/:id', ctrl.getReservation)

// POST /api/reservations          – staff trở lên
router.post('/', requireRole('staff', 'manager', 'admin'), ctrl.createReservation)

// PUT  /api/reservations/:id      – staff trở lên
router.put('/:id', requireRole('staff', 'manager', 'admin'), ctrl.updateReservation)

// DELETE /api/reservations/:id   – manager / admin
router.delete('/:id', requireRole('manager', 'admin'), ctrl.deleteReservation)

module.exports = router