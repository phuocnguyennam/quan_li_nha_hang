// repositories/userRepository.js
const { query, sql } = require('../config/db')

const USER_SELECT = `
  SELECT
    u.id,
    u.name,
    u.full_name,
    u.email,
    u.hashed_password,
    u.salt,
    u.status,
    u.role_id,
    r.name AS role_name
  FROM [User] u
  INNER JOIN Role r ON r.id = u.role_id
`

/** Lấy tất cả users (kèm tên role) */
async function getUsers() {
  const result = await query(`${USER_SELECT} ORDER BY u.id`)
  return result.recordset
}

/** Lấy user theo id */
async function getUser(id) {
  const result = await query(
    `${USER_SELECT} WHERE u.id = @id`,
    { id: { type: sql.Int, value: id } }
  )
  return result.recordset[0] || null
}

/** Tìm user theo username (field `name`) — thay thế getUserByUsername */
async function getUserByUsername(username) {
  const result = await query(
    `${USER_SELECT} WHERE u.name = @username`,
    { username: { type: sql.NVarChar(50), value: username } }
  )
  return result.recordset[0] || null
}

/** Tìm user theo email */
async function getUserByEmail(email) {
  const result = await query(
    `${USER_SELECT} WHERE u.email = @email`,
    { email: { type: sql.NVarChar(150), value: email } }
  )
  return result.recordset[0] || null
}

/** Thêm user mới */
async function addUser(data) {
  const result = await query(
    `INSERT INTO [User] (name, full_name, email, hashed_password, salt, role_id, status)
     OUTPUT INSERTED.id, INSERTED.name, INSERTED.full_name,
            INSERTED.email, INSERTED.role_id, INSERTED.status
     VALUES (@name, @full_name, @email, @hashed_password, @salt, @role_id, @status)`,
    {
      name:            { type: sql.NVarChar(50),  value: data.name },
      full_name:       { type: sql.NVarChar(100), value: data.full_name  || null },
      email:           { type: sql.NVarChar(150), value: data.email      || null },
      hashed_password: { type: sql.NVarChar(255), value: data.hashed_password },
      salt:            { type: sql.NVarChar(32),  value: data.salt },
      role_id:         { type: sql.Int,           value: data.role_id },
      status:          { type: sql.TinyInt,       value: data.status ?? 1 },
    }
  )
  return result.recordset[0]
}

/** Cập nhật thông tin user */
async function updateUser(id, data) {
  // Chỉ update các field được truyền vào
  const fields = []
  const params = { id: { type: sql.Int, value: id } }

  if (data.name !== undefined) {
    fields.push('name = @name')
    params.name = { type: sql.NVarChar(50), value: data.name }
  }
  if (data.full_name !== undefined) {
    fields.push('full_name = @full_name')
    params.full_name = { type: sql.NVarChar(100), value: data.full_name }
  }
  if (data.email !== undefined) {
    fields.push('email = @email')
    params.email = { type: sql.NVarChar(150), value: data.email }
  }
  if (data.hashed_password !== undefined) {
    fields.push('hashed_password = @hashed_password')
    params.hashed_password = { type: sql.NVarChar(255), value: data.hashed_password }
  }
  if (data.salt !== undefined) {
    fields.push('salt = @salt')
    params.salt = { type: sql.NVarChar(32), value: data.salt }
  }
  if (data.role_id !== undefined) {
    fields.push('role_id = @role_id')
    params.role_id = { type: sql.Int, value: data.role_id }
  }
  if (data.status !== undefined) {
    fields.push('status = @status')
    params.status = { type: sql.TinyInt, value: data.status }
  }

  if (fields.length === 0) return getUser(id)

  const result = await query(
    `UPDATE [User]
     SET ${fields.join(', ')}
     OUTPUT INSERTED.id, INSERTED.name, INSERTED.full_name,
            INSERTED.email, INSERTED.role_id, INSERTED.status
     WHERE id = @id`,
    params
  )
  return result.recordset[0] || null
}

/** Xoá user */
async function deleteUser(id) {
  await query(
    'DELETE FROM [User] WHERE id = @id',
    { id: { type: sql.Int, value: id } }
  )
  return true
}

module.exports = {
  getUsers,
  getUser,
  getUserByUsername,
  getUserByEmail,
  addUser,
  updateUser,
  deleteUser,
}