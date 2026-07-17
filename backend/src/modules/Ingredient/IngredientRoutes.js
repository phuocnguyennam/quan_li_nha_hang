const express = require('express')
const router  = express.Router()
const { requireAuth, requireRole } = require('../../middlewares/Authmiddleware')
const ctrl = require('./IngredientController')

router.use(requireAuth)

router.get('/ingredients', ctrl.listIngredients)
router.get('/ingredients/:id', ctrl.getIngredient)
router.post('/ingredients', requireRole('manager', 'admin'), ctrl.createIngredient)
router.put('/ingredients/:id', requireRole('manager', 'admin'), ctrl.updateIngredient)
router.delete('/ingredients/:id', requireRole('admin'), ctrl.deleteIngredient)

module.exports = router