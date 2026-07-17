const express = require('express')
const router  = express.Router()
const { requireAuth } = require('../../middlewares/Authmiddleware')
const ctrl = require('./InvoiceController')

router.use(requireAuth)

router.get('/invoices', ctrl.listInvoices)

module.exports = router