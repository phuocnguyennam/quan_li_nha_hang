// repositories/roleRepository.js
const { query, sql } = require('../../config/db')

/** Lấy tất cả roles */
async function getRoles() {
  const result = await query('SELECT id, name FROM Role ORDER BY id')
  return result.recordset
}

/** Lấy role theo id */
async function getRole(id) {
  const result = await query(
    'SELECT id, name FROM Role WHERE id = @id',
    { id: { type: sql.Int, value: id } }
  )
  return result.recordset[0] || null
}

/** Thêm role mới */
async function addRole(data) {
  const result = await query(
    `INSERT INTO Role (name)
     OUTPUT INSERTED.*
     VALUES (@name)`,
    { name: { type: sql.NVarChar(50), value: data.name } }
  )
  return result.recordset[0]
}

/** Cập nhật role */
async function updateRole(id, data) {
  const result = await query(
    `UPDATE Role
     SET name = @name
     OUTPUT INSERTED.*
     WHERE id = @id`,
    {
      id:   { type: sql.Int,          value: id },
      name: { type: sql.NVarChar(50), value: data.name },
    }
  )
  return result.recordset[0] || null
}

/** Xoá role */
async function deleteRole(id) {
  await query(
    'DELETE FROM Role WHERE id = @id',
    { id: { type: sql.Int, value: id } }
  )
  return true
}

module.exports = { getRoles, getRole, addRole, updateRole, deleteRole }