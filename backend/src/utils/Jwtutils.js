const jwt = require('jsonwebtoken')

const JWT_SECRET         = process.env.JWT_SECRET         || 'change_this_secret_in_production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change_this_refresh_secret_in_production'
const JWT_EXPIRES_IN     = '15m' // Access token sống ngắn (15 phút)
const JWT_REFRESH_IN     = '7d'  // Refresh token mặc định sống 7 ngày
const JWT_REMEMBER_IN    = '30d' // Refresh token remember me sống 30 ngày

/**
 * Ký JWT Access Token (15 phút)
 * @param {{ id, username, full_name, role_id, role_name }} payload
 * @returns {string} JWT string
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/**
 * Xác minh và giải mã Access Token
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

/**
 * Ký JWT Refresh Token (7 ngày hoặc 30 ngày)
 * @param {{ id }} payload
 * @param {boolean} remember
 * @returns {string} JWT string
 */
function signRefreshToken(payload, remember = false) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: remember ? JWT_REMEMBER_IN : JWT_REFRESH_IN,
  })
}

/**
 * Xác minh và giải mã Refresh Token
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET)
}

module.exports = {
  signToken,
  verifyToken,
  signRefreshToken,
  verifyRefreshToken
}