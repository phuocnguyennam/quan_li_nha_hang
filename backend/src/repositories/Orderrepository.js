// repositories/orderRepository.js
const { query, sql } = require('../config/db')

// ─────────────────────────────────────────────
//  ORDER
// ─────────────────────────────────────────────

/** Lấy tất cả đơn hàng (không bao gồm items) */
async function getOrders() {
  const result = await query(`
    SELECT id, table_name, total_amount, created_at
    FROM [Order]
    ORDER BY created_at DESC
  `)
  return result.recordset
}

/**
 * Lấy đơn hàng kèm toàn bộ items — thay thế getOrder + getOrderDetailsForOrder
 */
async function getOrder(id) {
  const [orderRes, itemsRes] = await Promise.all([
    query(
      'SELECT id, table_name, total_amount, created_at FROM [Order] WHERE id = @id',
      { id: { type: sql.BigInt, value: id } }
    ),
    query(
      `SELECT id, order_id, dish_name, quantity, completed
       FROM Order_Item WHERE order_id = @id ORDER BY id`,
      { id: { type: sql.BigInt, value: id } }
    ),
  ])

  if (!orderRes.recordset[0]) return null
  return {
    ...orderRes.recordset[0],
    items: itemsRes.recordset,
  }
}

/**
 * Tạo đơn hàng mới kèm items trong 1 transaction
 * data = { table_name, total_amount, items: [{ id?, dish_name, quantity, completed }] }
 */
async function addOrder(data) {
  const { getPool, sql: sqlLib } = require('../config/db')
  const pool = await getPool()
  const transaction = new sqlLib.Transaction(pool)

  try {
    await transaction.begin()
    const req = new sqlLib.Request(transaction)

    // Tạo ID dựa trên timestamp (giữ tương thích với Firebase)
    const orderId = data.id || Date.now()

    req.input('id',           sqlLib.BigInt,       orderId)
    req.input('table_name',   sqlLib.NVarChar(100), data.table_name   || data.table_number || null)
    req.input('total_amount', sqlLib.Decimal(12,2), data.total_amount || 0)
    req.input('created_at',   sqlLib.DateTime2,     data.timestamp ? new Date(data.timestamp) : new Date())

    await req.query(`
      INSERT INTO [Order] (id, table_name, total_amount, created_at)
      VALUES (@id, @table_name, @total_amount, @created_at)
    `)

    const items = data.items || []
    for (const item of items) {
      const itemReq = new sqlLib.Request(transaction)
      const itemId  = item.id ? parseInt(item.id) : Date.now() + Math.random()
      itemReq.input('id',        sqlLib.BigInt,       Math.trunc(itemId))
      itemReq.input('order_id',  sqlLib.BigInt,       orderId)
      itemReq.input('dish_name', sqlLib.NVarChar(150), item.dishName || item.dish_name || '')
      itemReq.input('quantity',  sqlLib.Int,           item.quantity  || 1)
      itemReq.input('completed', sqlLib.Bit,           item.completed ? 1 : 0)
      await itemReq.query(`
        INSERT INTO Order_Item (id, order_id, dish_name, quantity, completed)
        VALUES (@id, @order_id, @dish_name, @quantity, @completed)
      `)
    }

    await transaction.commit()
    return getOrder(orderId)
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

/** Cập nhật thông tin đơn hàng (không cập nhật items) */
async function updateOrder(id, data) {
  const fields = []
  const params = { id: { type: sql.BigInt, value: id } }

  if (data.table_name   !== undefined || data.table_number !== undefined) {
    fields.push('table_name = @table_name')
    params.table_name = { type: sql.NVarChar(100), value: data.table_name || data.table_number }
  }
  if (data.total_amount !== undefined) {
    fields.push('total_amount = @total_amount')
    params.total_amount = { type: sql.Decimal(12,2), value: data.total_amount }
  }

  if (fields.length === 0) return getOrder(id)

  await query(
    `UPDATE [Order] SET ${fields.join(', ')} WHERE id = @id`,
    params
  )
  return getOrder(id)
}

/** Xoá đơn hàng (items xoá cascade hoặc xoá thủ công trước) */
async function deleteOrder(id) {
  await query('DELETE FROM Order_Item WHERE order_id = @id', { id: { type: sql.BigInt, value: id } })
  await query('DELETE FROM [Order] WHERE id = @id',          { id: { type: sql.BigInt, value: id } })
  return true
}

// ─────────────────────────────────────────────
//  ORDER ITEM  (thay thế OrderDetail trong Firebase)
// ─────────────────────────────────────────────

/** Lấy tất cả items của 1 đơn hàng — thay thế getOrderDetailsForOrder */
async function getOrderDetailsForOrder(order_id) {
  const result = await query(
    `SELECT id, order_id, dish_name, quantity, completed
     FROM Order_Item WHERE order_id = @order_id ORDER BY id`,
    { order_id: { type: sql.BigInt, value: order_id } }
  )
  return result.recordset
}

/** Thêm hoặc cập nhật 1 item trong đơn — thay thế setOrderDetail */
async function setOrderDetail(order_id, item_id, data) {
  const result = await query(
    `MERGE Order_Item AS target
     USING (SELECT @id AS id, @order_id AS order_id) AS src
       ON target.id = src.id AND target.order_id = src.order_id
     WHEN MATCHED THEN
       UPDATE SET
         dish_name = @dish_name,
         quantity  = @quantity,
         completed = @completed
     WHEN NOT MATCHED THEN
       INSERT (id, order_id, dish_name, quantity, completed)
       VALUES (@id, @order_id, @dish_name, @quantity, @completed)
     OUTPUT INSERTED.*;`,
    {
      id:        { type: sql.BigInt,       value: Math.trunc(parseInt(item_id)) },
      order_id:  { type: sql.BigInt,       value: order_id },
      dish_name: { type: sql.NVarChar(150), value: data.dishName || data.dish_name || '' },
      quantity:  { type: sql.Int,          value: data.quantity  || 1 },
      completed: { type: sql.Bit,          value: data.completed ? 1 : 0 },
    }
  )
  return result.recordset[0]
}

/** Lấy 1 item theo order_id + item_id — thay thế getOrderDetail */
async function getOrderDetail(order_id, item_id) {
  const result = await query(
    `SELECT id, order_id, dish_name, quantity, completed
     FROM Order_Item WHERE order_id = @order_id AND id = @id`,
    {
      order_id: { type: sql.BigInt, value: order_id },
      id:       { type: sql.BigInt, value: item_id },
    }
  )
  return result.recordset[0] || null
}

/** Cập nhật trạng thái completed của item */
async function updateOrderItemStatus(item_id, completed) {
  const result = await query(
    `UPDATE Order_Item SET completed = @completed OUTPUT INSERTED.* WHERE id = @id`,
    {
      id:        { type: sql.BigInt, value: item_id },
      completed: { type: sql.Bit,    value: completed ? 1 : 0 },
    }
  )
  return result.recordset[0] || null
}

/** Xoá 1 item — thay thế deleteOrderDetail */
async function deleteOrderDetail(order_id, item_id) {
  await query(
    'DELETE FROM Order_Item WHERE order_id = @order_id AND id = @id',
    {
      order_id: { type: sql.BigInt, value: order_id },
      id:       { type: sql.BigInt, value: item_id },
    }
  )
  return true
}

module.exports = {
  // Order
  getOrders,
  getOrder,
  addOrder,
  updateOrder,
  deleteOrder,
  // Order Item
  getOrderDetailsForOrder,
  setOrderDetail,
  getOrderDetail,
  updateOrderItemStatus,
  deleteOrderDetail,
}