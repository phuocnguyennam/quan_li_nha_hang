// repositories/ingredientRepository.js
const { query, sql } = require('../config/db')

/** Lấy tất cả nguyên liệu */
async function getIngredients() {
  const result = await query('SELECT id, name, quantity, unit FROM Ingredient ORDER BY name')
  return result.recordset
}

/** Lấy nguyên liệu theo id */
async function getIngredient(id) {
  const result = await query(
    'SELECT id, name, quantity, unit FROM Ingredient WHERE id = @id',
    { id: { type: sql.Int, value: id } }
  )
  return result.recordset[0] || null
}

/** Thêm nguyên liệu */
async function addIngredient(data) {
  const result = await query(
    `INSERT INTO Ingredient (name, quantity, unit)
     OUTPUT INSERTED.*
     VALUES (@name, @quantity, @unit)`,
    {
      name:     { type: sql.NVarChar(150), value: data.name },
      quantity: { type: sql.Decimal(12, 2), value: data.quantity || 0 },
      unit:     { type: sql.NVarChar(20),  value: data.unit || null },
    }
  )
  return result.recordset[0]
}

/** Cập nhật nguyên liệu */
async function updateIngredient(id, data) {
  const fields = []
  const params = { id: { type: sql.Int, value: id } }

  if (data.name !== undefined) {
    fields.push('name = @name')
    params.name = { type: sql.NVarChar(150), value: data.name }
  }
  if (data.quantity !== undefined) {
    fields.push('quantity = @quantity')
    params.quantity = { type: sql.Decimal(12, 2), value: data.quantity }
  }
  if (data.unit !== undefined) {
    fields.push('unit = @unit')
    params.unit = { type: sql.NVarChar(20), value: data.unit }
  }

  if (fields.length === 0) return getIngredient(id)

  const result = await query(
    `UPDATE Ingredient SET ${fields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`,
    params
  )
  return result.recordset[0] || null
}

/**
 * Điều chỉnh số lượng tồn kho (cộng / trừ)
 * @param {number} id
 * @param {number} delta - Số dương = nhập thêm, số âm = xuất
 */
async function adjustQuantity(id, delta) {
  const result = await query(
    `UPDATE Ingredient
     SET quantity = quantity + @delta
     OUTPUT INSERTED.*
     WHERE id = @id`,
    {
      id:    { type: sql.Int,           value: id },
      delta: { type: sql.Decimal(12,2), value: delta },
    }
  )
  return result.recordset[0] || null
}

/** Xoá nguyên liệu */
async function deleteIngredient(id) {
  await query(
    'DELETE FROM Ingredient WHERE id = @id',
    { id: { type: sql.Int, value: id } }
  )
  return true
}

module.exports = {
  getIngredients,
  getIngredient,
  addIngredient,
  updateIngredient,
  adjustQuantity,
  deleteIngredient,
}