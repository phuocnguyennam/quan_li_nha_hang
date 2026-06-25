// repositories/reservationRepository.js
const { query, sql } = require('../config/db')

const RESERVATION_SELECT = `
  SELECT
    r.id,
    r.table_id,
    t.name  AS table_name,
    t.code  AS table_code,
    r.customer_name,
    r.phone,
    r.reserved_time,
    r.created_at
  FROM Reservation r
  LEFT JOIN [Table] t ON t.id = r.table_id
`

/** Lấy tất cả đặt bàn (kèm thông tin bàn) */
async function getReservations() {
  const result = await query(`${RESERVATION_SELECT} ORDER BY r.reserved_time`)
  return result.recordset
}

/** Lấy đặt bàn theo id */
async function getReservation(id) {
  const result = await query(
    `${RESERVATION_SELECT} WHERE r.id = @id`,
    { id: { type: sql.Int, value: id } }
  )
  return result.recordset[0] || null
}

/** Lấy đặt bàn theo table_id */
async function getReservationsByTable(table_id) {
  const result = await query(
    `${RESERVATION_SELECT} WHERE r.table_id = @table_id ORDER BY r.reserved_time`,
    { table_id: { type: sql.Int, value: table_id } }
  )
  return result.recordset
}

/** Thêm đặt bàn mới */
async function addReservation(data) {
  const result = await query(
    `INSERT INTO Reservation (table_id, customer_name, phone, reserved_time)
     OUTPUT INSERTED.*
     VALUES (@table_id, @customer_name, @phone, @reserved_time)`,
    {
      table_id:      { type: sql.Int,           value: data.table_id   || null },
      customer_name: { type: sql.NVarChar(100), value: data.customer_name || null },
      phone:         { type: sql.NVarChar(20),  value: data.phone      || null },
      reserved_time: { type: sql.DateTime2,     value: data.time       || data.reserved_time || null },
    }
  )
  return result.recordset[0]
}

/** Cập nhật đặt bàn */
async function updateReservation(id, data) {
  const fields = []
  const params = { id: { type: sql.Int, value: id } }

  if (data.table_id      !== undefined) { fields.push('table_id = @table_id');           params.table_id      = { type: sql.Int,           value: data.table_id } }
  if (data.customer_name !== undefined) { fields.push('customer_name = @customer_name'); params.customer_name = { type: sql.NVarChar(100), value: data.customer_name } }
  if (data.phone         !== undefined) { fields.push('phone = @phone');                 params.phone         = { type: sql.NVarChar(20),  value: data.phone } }
  if (data.time          !== undefined || data.reserved_time !== undefined) {
    fields.push('reserved_time = @reserved_time')
    params.reserved_time = { type: sql.DateTime2, value: data.time || data.reserved_time }
  }

  if (fields.length === 0) return getReservation(id)

  const result = await query(
    `UPDATE Reservation SET ${fields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`,
    params
  )
  return result.recordset[0] || null
}

/** Xoá đặt bàn */
async function deleteReservation(id) {
  await query(
    'DELETE FROM Reservation WHERE id = @id',
    { id: { type: sql.Int, value: id } }
  )
  return true
}

module.exports = {
  getReservations,
  getReservation,
  getReservationsByTable,
  addReservation,
  updateReservation,
  deleteReservation,
}