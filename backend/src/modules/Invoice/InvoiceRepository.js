// repositories/invoiceRepository.js
// ⚠️  Invoice chưa có trong Firebase export, bảng này cần tạo thêm trong SQL
// Chạy migration bên dưới trước khi dùng

/*
  -- Migration (thêm vào RESTAURANT_DB.sql nếu chưa có)
  CREATE TABLE Invoice (
    id            INT            IDENTITY(1,1) PRIMARY KEY,
    order_id      BIGINT         NULL REFERENCES [Order](id),
    table_name    NVARCHAR(100)  NULL,
    subtotal      DECIMAL(12,2)  NOT NULL DEFAULT 0,
    discount      DECIMAL(12,2)  NOT NULL DEFAULT 0,
    tax           DECIMAL(12,2)  NOT NULL DEFAULT 0,
    total         DECIMAL(12,2)  NOT NULL DEFAULT 0,
    payment_method NVARCHAR(50)  NULL,   -- 'Cash' | 'Card' | 'Transfer'
    note          NVARCHAR(500)  NULL,
    created_at    DATETIME2      NOT NULL DEFAULT GETDATE()
  );
  GO
  CREATE INDEX IX_Invoice_Order ON Invoice(order_id);
*/

const { query, sql } = require('../../config/db')

const INVOICE_SELECT = `
  SELECT
    inv.id,
    inv.order_id,
    inv.table_name,
    inv.subtotal,
    inv.discount,
    inv.tax,
    inv.total,
    inv.payment_method,
    inv.note,
    inv.created_at
  FROM Invoice inv
`

/** Lấy tất cả hoá đơn */
async function getInvoices() {
  const result = await query(`${INVOICE_SELECT} ORDER BY inv.created_at DESC`)
  return result.recordset
}

/** Lấy hoá đơn theo id */
async function getInvoice(id) {
  const result = await query(
    `${INVOICE_SELECT} WHERE inv.id = @id`,
    { id: { type: sql.Int, value: id } }
  )
  return result.recordset[0] || null
}

/** Lấy hoá đơn theo order_id */
async function getInvoiceByOrder(order_id) {
  const result = await query(
    `${INVOICE_SELECT} WHERE inv.order_id = @order_id`,
    { order_id: { type: sql.BigInt, value: order_id } }
  )
  return result.recordset[0] || null
}

/** Tạo hoá đơn mới */
async function addInvoice(data) {
  const result = await query(
    `INSERT INTO Invoice
       (order_id, table_name, subtotal, discount, tax, total, payment_method, note)
     OUTPUT INSERTED.*
     VALUES
       (@order_id, @table_name, @subtotal, @discount, @tax, @total, @payment_method, @note)`,
    {
      order_id:       { type: sql.BigInt,       value: data.order_id      || null },
      table_name:     { type: sql.NVarChar(100), value: data.table_name   || null },
      subtotal:       { type: sql.Decimal(12,2), value: data.subtotal     || 0 },
      discount:       { type: sql.Decimal(12,2), value: data.discount     || 0 },
      tax:            { type: sql.Decimal(12,2), value: data.tax          || 0 },
      total:          { type: sql.Decimal(12,2), value: data.total        || 0 },
      payment_method: { type: sql.NVarChar(50),  value: data.payment_method || null },
      note:           { type: sql.NVarChar(500), value: data.note         || null },
    }
  )
  return result.recordset[0]
}

/** Cập nhật hoá đơn */
async function updateInvoice(id, data) {
  const fields = []
  const params = { id: { type: sql.Int, value: id } }

  const fieldMap = {
    order_id:       { type: sql.BigInt,       col: 'order_id' },
    table_name:     { type: sql.NVarChar(100), col: 'table_name' },
    subtotal:       { type: sql.Decimal(12,2), col: 'subtotal' },
    discount:       { type: sql.Decimal(12,2), col: 'discount' },
    tax:            { type: sql.Decimal(12,2), col: 'tax' },
    total:          { type: sql.Decimal(12,2), col: 'total' },
    payment_method: { type: sql.NVarChar(50),  col: 'payment_method' },
    note:           { type: sql.NVarChar(500), col: 'note' },
  }

  for (const [dataKey, meta] of Object.entries(fieldMap)) {
    if (data[dataKey] !== undefined) {
      fields.push(`${meta.col} = @${meta.col}`)
      params[meta.col] = { type: meta.type, value: data[dataKey] }
    }
  }

  if (fields.length === 0) return getInvoice(id)

  const result = await query(
    `UPDATE Invoice SET ${fields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`,
    params
  )
  return result.recordset[0] || null
}

/** Xoá hoá đơn */
async function deleteInvoice(id) {
  await query('DELETE FROM Invoice WHERE id = @id', { id: { type: sql.Int, value: id } })
  return true
}

module.exports = {
  getInvoices,
  getInvoice,
  getInvoiceByOrder,
  addInvoice,
  updateInvoice,
  deleteInvoice,
}