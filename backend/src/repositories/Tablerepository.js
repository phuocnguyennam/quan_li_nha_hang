// repositories/tableRepository.js
const { query, sql } = require('../config/db')

const TABLE_SELECT = `
  SELECT
    t.id,
    t.code,
    t.name,
    t.area_id,
    a.name  AS area_name,
    t.capacity,
    t.seats,
    t.status,
    t.reservation_time
  FROM [Table] t
  INNER JOIN Area a ON a.id = t.area_id
`

/** Lấy tất cả bàn (kèm tên khu vực) */
async function getTables() {
  const result = await query(`${TABLE_SELECT} ORDER BY t.area_id, t.code`)
  return result.recordset
}

/** Lấy bàn theo id */
async function getTable(id) {
  const result = await query(
    `${TABLE_SELECT} WHERE t.id = @id`,
    { id: { type: sql.Int, value: id } }
  )
  return result.recordset[0] || null
}

/** Lấy bàn theo khu vực */
async function getTablesByArea(area_id) {
  const result = await query(
    `${TABLE_SELECT} WHERE t.area_id = @area_id ORDER BY t.code`,
    { area_id: { type: sql.Int, value: area_id } }
  )
  return result.recordset
}

/** Lấy bàn theo trạng thái: 'Available' | 'Occupied' | 'Reserved' */
async function getTablesByStatus(status) {
  const result = await query(
    `${TABLE_SELECT} WHERE t.status = @status ORDER BY t.code`,
    { status: { type: sql.NVarChar(30), value: status } }
  )
  return result.recordset
}

/** Thêm bàn mới */
async function addTable(data) {
  const result = await query(
    `INSERT INTO [Table] (code, name, area_id, capacity, seats, status, reservation_time)
     OUTPUT INSERTED.*
     VALUES (@code, @name, @area_id, @capacity, @seats, @status, @reservation_time)`,
    {
      code:             { type: sql.NVarChar(20),  value: data.code },
      name:             { type: sql.NVarChar(100), value: data.name },
      area_id:          { type: sql.Int,           value: data.area_id || data.area },
      capacity:         { type: sql.Int,           value: data.capacity || 2 },
      seats:            { type: sql.Int,           value: data.seats    || 2 },
      status:           { type: sql.NVarChar(30),  value: data.status   || 'Available' },
      reservation_time: { type: sql.NVarChar(50),  value: data.reservation_time || null },
    }
  )
  return result.recordset[0]
}

/** Cập nhật bàn */
async function updateTable(id, data) {
  const fields = []
  const params = { id: { type: sql.Int, value: id } }

  const fieldMap = {
    code:             sql.NVarChar(20),
    name:             sql.NVarChar(100),
    area_id:          sql.Int,
    capacity:         sql.Int,
    seats:            sql.Int,
    status:           sql.NVarChar(30),
    reservation_time: sql.NVarChar(50),
  }

  for (const [col, type] of Object.entries(fieldMap)) {
    if (data[col] !== undefined) {
      fields.push(`${col} = @${col}`)
      params[col] = { type, value: data[col] }
    }
  }

  if (fields.length === 0) return getTable(id)

  const result = await query(
    `UPDATE [Table] SET ${fields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`,
    params
  )
  return result.recordset[0] || null
}

/** Cập nhật nhanh trạng thái bàn */
async function updateTableStatus(id, status) {
  const result = await query(
    `UPDATE [Table]
     SET status = @status
     OUTPUT INSERTED.*
     WHERE id = @id`,
    {
      id:     { type: sql.Int,          value: id },
      status: { type: sql.NVarChar(30), value: status },
    }
  )
  return result.recordset[0] || null
}

/** Xoá bàn */
async function deleteTable(id) {
  await query(
    'DELETE FROM [Table] WHERE id = @id',
    { id: { type: sql.Int, value: id } }
  )
  return true
}

// ---- Area ----

/** Lấy tất cả khu vực */
async function getAreas() {
  const result = await query('SELECT id, name FROM Area ORDER BY id')
  return result.recordset
}

/** Lấy khu vực theo id */
async function getArea(id) {
  const result = await query(
    'SELECT id, name FROM Area WHERE id = @id',
    { id: { type: sql.Int, value: id } }
  )
  return result.recordset[0] || null
}

/** Thêm khu vực */
async function addArea(data) {
  const result = await query(
    'INSERT INTO Area (name) OUTPUT INSERTED.* VALUES (@name)',
    { name: { type: sql.NVarChar(100), value: data.name } }
  )
  return result.recordset[0]
}

/** Cập nhật khu vực */
async function updateArea(id, data) {
  const result = await query(
    `UPDATE Area SET name = @name OUTPUT INSERTED.* WHERE id = @id`,
    {
      id:   { type: sql.Int,          value: id },
      name: { type: sql.NVarChar(100), value: data.name },
    }
  )
  return result.recordset[0] || null
}

/** Xoá khu vực */
async function deleteArea(id) {
  await query('DELETE FROM Area WHERE id = @id', { id: { type: sql.Int, value: id } })
  return true
}

module.exports = {
  // Table
  getTables,
  getTable,
  getTablesByArea,
  getTablesByStatus,
  addTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  // Area
  getAreas,
  getArea,
  addArea,
  updateArea,
  deleteArea,
}