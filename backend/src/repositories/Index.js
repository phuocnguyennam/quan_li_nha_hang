// repositories/index.js
// Re-export tất cả hàm — giữ interface giống api.js cũ
// Frontend/controller chỉ cần đổi import path, không cần đổi tên hàm

const role        = require('./roleRepository')
const user        = require('./userRepository')
const product     = require('./productRepository')
const ingredient  = require('./ingredientRepository')
const recipe      = require('./recipeRepository')
const table       = require('./tableRepository')
const reservation = require('./reservationRepository')
const order       = require('./orderRepository')
const invoice     = require('./invoiceRepository')

module.exports = {
  // ── Role ──────────────────────────────────────
  getRoles:    role.getRoles,
  getRole:     role.getRole,
  addRole:     role.addRole,
  updateRole:  role.updateRole,
  deleteRole:  role.deleteRole,

  // ── User ──────────────────────────────────────
  getUsers:          user.getUsers,
  getUser:           user.getUser,
  getUserByUsername: user.getUserByUsername,
  getUserByEmail:    user.getUserByEmail,    // ⭐ mới — Firebase không có
  addUser:           user.addUser,
  updateUser:        user.updateUser,
  deleteUser:        user.deleteUser,

  // ── Category (truy vấn từ Product) ────────────
  getCategories: product.getCategories,      // ⭐ trả về string[] thay vì collection riêng

  // ── Product ───────────────────────────────────
  getProducts:            product.getProducts,
  getProduct:             product.getProduct,
  getProductsByCategory:  product.getProductsByCategory, // ⭐ mới
  addProduct:             product.addProduct,
  updateProduct:          product.updateProduct,
  deleteProduct:          product.deleteProduct,

  // ── Ingredient ────────────────────────────────
  getIngredients:   ingredient.getIngredients,
  getIngredient:    ingredient.getIngredient,
  addIngredient:    ingredient.addIngredient,
  updateIngredient: ingredient.updateIngredient,
  adjustQuantity:   ingredient.adjustQuantity,  // ⭐ mới — cộng/trừ tồn kho
  deleteIngredient: ingredient.deleteIngredient,

  // ── Recipe ────────────────────────────────────
  getRecipes:             recipe.getRecipes,              // ⭐ mới — lấy tất cả
  getRecipesForProduct:   recipe.getRecipesForProduct,
  getRecipe:              recipe.getRecipe,
  setRecipe:              recipe.setRecipe,               // UPSERT
  deleteRecipe:           recipe.deleteRecipe,
  deleteRecipesForProduct: recipe.deleteRecipesForProduct, // ⭐ mới

  // ── Area ──────────────────────────────────────
  getAreas:   table.getAreas,
  getArea:    table.getArea,
  addArea:    table.addArea,
  updateArea: table.updateArea,
  deleteArea: table.deleteArea,

  // ── Table ─────────────────────────────────────
  getTables:         table.getTables,
  getTable:          table.getTable,
  getTablesByArea:   table.getTablesByArea,    // ⭐ mới
  getTablesByStatus: table.getTablesByStatus,  // ⭐ mới
  addTable:          table.addTable,
  updateTable:       table.updateTable,
  updateTableStatus: table.updateTableStatus,  // ⭐ mới — cập nhật nhanh status
  deleteTable:       table.deleteTable,

  // ── Reservation ───────────────────────────────
  getReservations:       reservation.getReservations,
  getReservation:        reservation.getReservation,
  getReservationsByTable: reservation.getReservationsByTable, // ⭐ mới
  addReservation:        reservation.addReservation,
  updateReservation:     reservation.updateReservation,
  deleteReservation:     reservation.deleteReservation,

  // ── Order ─────────────────────────────────────
  getOrders:    order.getOrders,
  getOrder:     order.getOrder,   // trả về order + items luôn
  addOrder:     order.addOrder,   // tạo order + items trong 1 transaction
  updateOrder:  order.updateOrder,
  deleteOrder:  order.deleteOrder,

  // ── Order Item (= OrderDetail cũ) ─────────────
  getOrderDetailsForOrder: order.getOrderDetailsForOrder,
  getOrderDetail:          order.getOrderDetail,
  setOrderDetail:          order.setOrderDetail,
  updateOrderItemStatus:   order.updateOrderItemStatus,  // ⭐ mới — cho kitchen staff
  deleteOrderDetail:       order.deleteOrderDetail,

  // ── Invoice ───────────────────────────────────
  getInvoices:      invoice.getInvoices,
  getInvoice:       invoice.getInvoice,
  getInvoiceByOrder: invoice.getInvoiceByOrder, // ⭐ mới
  addInvoice:       invoice.addInvoice,
  updateInvoice:    invoice.updateInvoice,
  deleteInvoice:    invoice.deleteInvoice,
}