// backend/src/modules/Seating/SeatingRoutes.js
const express = require('express')
const router  = express.Router()

const { requireAuth, requireRole } = require('../../middlewares/Authmiddleware')
const ctrl = require('./SeatingController')

// Tất cả route đều cần đăng nhập
router.use(requireAuth)

// ── Tables Routing ─────────────────────────────────────────────
router.get('/tables',    ctrl.listTables)
router.get('/tables/:id', ctrl.getTable)
router.post('/tables', requireRole('manager', 'admin'), ctrl.createTable)
router.put('/tables/:id', requireRole('manager', 'admin'), ctrl.updateTable)
router.patch('/tables/:id/status', requireRole('staff', 'manager', 'admin'), ctrl.updateTableStatus)
router.delete('/tables/:id', requireRole('admin'), ctrl.deleteTable)

// ── Areas Routing ──────────────────────────────────────────────
router.get('/areas', ctrl.listAreas)
router.get('/areas/:id', ctrl.getArea)
router.post('/areas', requireRole('manager', 'admin'), ctrl.createArea)
router.put('/areas/:id', requireRole('manager', 'admin'), ctrl.updateArea)
router.delete('/areas/:id', requireRole('admin'), ctrl.deleteArea)

module.exports = router