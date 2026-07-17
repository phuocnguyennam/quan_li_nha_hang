const repo = require('./OrderRepository')

async function listOrders(req, res) {
  try {
    const orders = await repo.getOrders()
    return res.json(orders)
  } catch (err) {
    console.error('[OrderController] listOrders:', err)
    return res.status(500).json({ message: 'Failed to fetch orders.' })
  }
}

async function createOrder(req, res) {
  try {
    // data must match what repo.addOrder expects:
    // { table_number, total_amount, items: [ { dishName, quantity, completed } ] }
    const { table_number, total_amount, items } = req.body
    if (!table_number) {
      return res.status(400).json({ message: 'table_number is required.' })
    }
    const created = await repo.addOrder({
      table_number,
      total_amount: Number(total_amount) || 0,
      items: items || [],
    })
    return res.status(201).json(created)
  } catch (err) {
    console.error('[OrderController] createOrder:', err)
    return res.status(500).json({ message: 'Failed to create order.' })
  }
}

module.exports = {
  listOrders,
  createOrder,
}