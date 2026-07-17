const express = require('express')
const router  = express.Router()
const { requireAuth, requireRole } = require('../../middlewares/Authmiddleware')
const ctrl = require('./MenuController')

router.use(requireAuth)

// Product routing
router.get('/products', ctrl.listProducts)
router.get('/products/categories', ctrl.listCategories)
router.get('/products/:id', ctrl.getProduct)
router.post('/products', requireRole('manager', 'admin'), ctrl.createProduct)
router.put('/products/:id', requireRole('manager', 'admin'), ctrl.updateProduct)
router.delete('/products/:id', requireRole('admin'), ctrl.deleteProduct)

// Recipe routing (nested under products)
router.get('/products/:id/recipes', ctrl.listRecipesForProduct)
router.post('/products/:id/recipes', requireRole('manager', 'admin'), ctrl.setRecipe)
router.delete('/products/:id/recipes/:ingredient_id', requireRole('manager', 'admin'), ctrl.deleteRecipe)

module.exports = router