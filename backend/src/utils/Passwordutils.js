// backend/src/utils/passwordUtils.js
// Utility thuần túy — không phụ thuộc DB, không phụ thuộc Express.
// Nhiệm vụ duy nhất: băm và xác minh mật khẩu.

const crypto = require('crypto')

const PBKDF2_ITERATIONS = 310_000   // NIST SP 800-132 khuyến nghị cho SHA-256
const PBKDF2_KEYLEN     = 64        // bytes → 128 hex chars
const PBKDF2_DIGEST     = 'sha256'

/**
 * Tạo salt ngẫu nhiên — lưu vào cột `salt` của bảng [User]
 * @returns {string} hex string 32 ký tự (16 bytes)
 */
function generateSalt() {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Băm mật khẩu với salt bằng PBKDF2-SHA256
 * @param {string} password  Mật khẩu gốc
 * @param {string} salt      Hex string từ generateSalt()
 * @returns {string}         Hex string 128 ký tự
 */
function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex')
}

/**
 * Tạo cặp { salt, hashed_password } cho mật khẩu mới
 * Dùng khi tạo user hoặc đổi mật khẩu
 * @param {string} password
 * @returns {{ salt: string, hashed_password: string }}
 */
function createPasswordHash(password) {
  const salt = generateSalt()
  return { salt, hashed_password: hashPassword(password, salt) }
}

/**
 * Kiểm tra mật khẩu nhập vào so với hash đã lưu trong DB
 * Dùng timingSafeEqual để tránh timing attack
 * @param {string} password        Mật khẩu người dùng nhập
 * @param {string} salt            Salt lấy từ DB
 * @param {string} hashed_password Hash lấy từ DB
 * @returns {boolean}
 */
function verifyPassword(password, salt, hashed_password) {
  const hashed = hashPassword(password, salt)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hashed,           'hex'),
      Buffer.from(hashed_password,  'hex')
    )
  } catch {
    // Buffer length mismatch → hash bị corrupt trong DB
    return false
  }
}

module.exports = { generateSalt, hashPassword, createPasswordHash, verifyPassword }