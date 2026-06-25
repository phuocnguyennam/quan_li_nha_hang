// repositories/productRepository.js
const { query, sql } = require('../config/db')

const PRODUCT_SELECT = `
  SELECT
    id,
    name,
    category,
    description,
    price,
    preparation_time,
    image_url,
    available
  FROM Product
`

/** Lấy tất cả sản phẩm */
async function getProducts() {
  const result = await query(`${PRODUCT_SELECT} ORDER BY category, name`)
  return result.recordset
}

/** Lấy sản phẩm theo id */
async function getProduct(id) {
  const result = await query(
    `${PRODUCT_SELECT} WHERE id = @id`,
    { id: { type: sql.Int, value: id } }
  )
  return result.recordset[0] || null
}

/** Lấy sản phẩm theo category */
async function getProductsByCategory(category) {
  const result = await query(
    `${PRODUCT_SELECT} WHERE category = @category ORDER BY name`,
    { category: { type: sql.NVarChar(100), value: category } }
  )
  return result.recordset
}

/** Lấy danh sách categories duy nhất */
async function getCategories() {
  const result = await query(
    'SELECT DISTINCT category FROM Product WHERE category IS NOT NULL ORDER BY category'
  )
  return result.recordset.map(r => r.category)
}

/** Thêm sản phẩm mới */
async function addProduct(data) {
  const result = await query(
    `INSERT INTO Product (name, category, description, price, preparation_time, image_url, available)
     OUTPUT INSERTED.*
     VALUES (@name, @category, @description, @price, @preparation_time, @image_url, @available)`,
    {
      name:             { type: sql.NVarChar(150),  value: data.name },
      category:         { type: sql.NVarChar(100),  value: data.category         || null },
      description:      { type: sql.NVarChar(500),  value: data.description      || null },
      price:            { type: sql.Decimal(10, 2), value: data.price            || 0 },
      preparation_time: { type: sql.Int,            value: data.preparationTime  || data.preparation_time || null },
      image_url:        { type: sql.NVarChar(1000), value: data.image            || data.image_url        || null },
      available:        { type: sql.Bit,            value: data.available ?? true },
    }
  )
  return result.recordset[0]
}

/** Cập nhật sản phẩm */
async function updateProduct(id, data) {
  const fields = []
  const params = { id: { type: sql.Int, value: id } }

  const map = {
    name:             { type: sql.NVarChar(150),  key: 'name' },
    category:         { type: sql.NVarChar(100),  key: 'category' },
    description:      { type: sql.NVarChar(500),  key: 'description' },
    price:            { type: sql.Decimal(10, 2), key: 'price' },
    preparation_time: { type: sql.Int,            key: 'preparation_time' },
    preparationTime:  { type: sql.Int,            key: 'preparation_time' }, // alias Firebase
    image_url:        { type: sql.NVarChar(1000), key: 'image_url' },
    image:            { type: sql.NVarChar(1000), key: 'image_url' },        // alias Firebase
    available:        { type: sql.Bit,            key: 'available' },
  }

  for (const [dataKey, meta] of Object.entries(map)) {
    if (data[dataKey] !== undefined) {
      fields.push(`${meta.key} = @${meta.key}`)
      params[meta.key] = { type: meta.type, value: data[dataKey] }
    }
  }

  if (fields.length === 0) return getProduct(id)

  // Dùng Set để tránh duplicate nếu cả image lẫn image_url cùng được truyền
  const uniqueFields = [...new Set(fields)]
  const result = await query(
    `UPDATE Product SET ${uniqueFields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`,
    params
  )
  return result.recordset[0] || null
}

/** Xoá sản phẩm */
async function deleteProduct(id) {
  await query(
    'DELETE FROM Product WHERE id = @id',
    { id: { type: sql.Int, value: id } }
  )
  return true
}

module.exports = {
  getProducts,
  getProduct,
  getProductsByCategory,
  getCategories,
  addProduct,
  updateProduct,
  deleteProduct,
}