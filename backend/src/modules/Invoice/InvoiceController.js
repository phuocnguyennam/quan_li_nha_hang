const repo = require('./InvoiceRepository')

async function listInvoices(req, res) {
  try {
    const invoices = await repo.getInvoices()
    return res.json(invoices)
  } catch (err) {
    console.error('[InvoiceController] listInvoices:', err)
    return res.status(500).json({ message: 'Failed to fetch invoices.' })
  }
}

module.exports = {
  listInvoices,
}