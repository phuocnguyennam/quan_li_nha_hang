const express = require('express')
const router  = express.Router()
const { requireAuth } = require('../../middlewares/Authmiddleware')
const ctrl = require('./OrderController')

router.use(requireAuth)

router.get('/orders', ctrl.listOrders)
router.post('/orders', ctrl.createOrder)

module.exports = router