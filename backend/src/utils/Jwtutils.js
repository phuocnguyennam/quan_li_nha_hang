// backend/src/utils/jwtUtils.js
// Utility thuần túy — không phụ thuộc DB, không phụ thuộc Express.
// Nhiệm vụ duy nhất: ký và xác minh JWT token.

const jwt = require('jsonwebtoken')

const JWT_SECRET      = process.env.JWT_SECRET      || 'change_this_secret_in_production'
const JWT_EXPIRES_IN  = process.env.JWT_EXPIRES_IN  || '8h'
const JWT_REMEMBER_IN = process.env.JWT_REMEMBER_IN || '30d'

/**
 * Ký JWT token
 * @param {{ id, username, full_name, role_id, role_name }} payload
 * @param {boolean} remember  true → token sống 30 ngày
 * @returns {string} JWT string
 */
function signToken(payload, remember = false) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: remember ? JWT_REMEMBER_IN : JWT_EXPIRES_IN,
  })
}

/**
 * Xác minh và giải mã JWT token
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = { signToken, verifyToken }