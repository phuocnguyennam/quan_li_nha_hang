// repositories/recipeRepository.js
const { query, sql } = require('../config/db')

/**
 * Lấy tất cả recipe (kèm tên product và ingredient)
 */
async function getRecipes() {
  const result = await query(`
    SELECT
      r.id,
      r.product_id,
      p.name    AS product_name,
      r.ingredient_id,
      i.name    AS ingredient_name,
      i.unit,
      r.amount
    FROM Recipe r
    INNER JOIN Product    p ON p.id = r.product_id
    INNER JOIN Ingredient i ON i.id = r.ingredient_id
    ORDER BY p.name, i.name
  `)
  return result.recordset
}

/**
 * Lấy tất cả nguyên liệu của 1 sản phẩm — thay thế getRecipesForProduct
 */
async function getRecipesForProduct(product_id) {
  const result = await query(
    `SELECT
       r.id,
       r.product_id,
       r.ingredient_id,
       i.name   AS ingredient_name,
       i.unit,
       r.amount
     FROM Recipe r
     INNER JOIN Ingredient i ON i.id = r.ingredient_id
     WHERE r.product_id = @product_id
     ORDER BY i.name`,
    { product_id: { type: sql.Int, value: product_id } }
  )
  return result.recordset
}

/**
 * Lấy 1 dòng recipe theo product + ingredient
 */
async function getRecipe(product_id, ingredient_id) {
  const result = await query(
    `SELECT r.*, i.name AS ingredient_name, i.unit
     FROM Recipe r
     INNER JOIN Ingredient i ON i.id = r.ingredient_id
     WHERE r.product_id = @product_id AND r.ingredient_id = @ingredient_id`,
    {
      product_id:    { type: sql.Int, value: product_id },
      ingredient_id: { type: sql.Int, value: ingredient_id },
    }
  )
  return result.recordset[0] || null
}

/**
 * Thêm hoặc cập nhật recipe (UPSERT) — thay thế setRecipe
 */
async function setRecipe(product_id, ingredient_id, data) {
  const result = await query(
    `MERGE Recipe AS target
     USING (SELECT @product_id AS product_id, @ingredient_id AS ingredient_id) AS src
       ON target.product_id = src.product_id AND target.ingredient_id = src.ingredient_id
     WHEN MATCHED THEN
       UPDATE SET amount = @amount
     WHEN NOT MATCHED THEN
       INSERT (product_id, ingredient_id, amount)
       VALUES (@product_id, @ingredient_id, @amount)
     OUTPUT INSERTED.*;`,
    {
      product_id:    { type: sql.Int,           value: product_id },
      ingredient_id: { type: sql.Int,           value: ingredient_id },
      amount:        { type: sql.Decimal(12,2), value: data.amount || 0 },
    }
  )
  return result.recordset[0]
}

/**
 * Xoá 1 dòng recipe
 */
async function deleteRecipe(product_id, ingredient_id) {
  await query(
    'DELETE FROM Recipe WHERE product_id = @product_id AND ingredient_id = @ingredient_id',
    {
      product_id:    { type: sql.Int, value: product_id },
      ingredient_id: { type: sql.Int, value: ingredient_id },
    }
  )
  return true
}

/**
 * Xoá toàn bộ recipe của 1 sản phẩm (dùng khi xoá product hoặc thay thế hàng loạt)
 */
async function deleteRecipesForProduct(product_id) {
  await query(
    'DELETE FROM Recipe WHERE product_id = @product_id',
    { product_id: { type: sql.Int, value: product_id } }
  )
  return true
}

module.exports = {
  getRecipes,
  getRecipesForProduct,
  getRecipe,
  setRecipe,
  deleteRecipe,
  deleteRecipesForProduct,
}