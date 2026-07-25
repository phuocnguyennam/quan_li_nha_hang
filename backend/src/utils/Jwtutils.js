const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')

const KEYCLOAK_SERVER_URL = process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080'
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'master'

const client = jwksClient({
  jwksUri: `${KEYCLOAK_SERVER_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
})

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      callback(err)
    } else {
      const signingKey = key.getPublicKey()
      callback(null, signingKey)
    }
  })
}

/**
 * Xác minh và giải mã Access Token từ Keycloak sử dụng JWKS
 * @param {string} token
 * @returns {Promise<object>} decoded payload
 */
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      issuer: `${KEYCLOAK_SERVER_URL}/realms/${KEYCLOAK_REALM}`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        reject(err)
      } else {
        // Ánh xạ role ID sang role name theo cấu hình Keycloak và database
        // Keycloak roles: "1" (Admin), "2" (manager), "3" (staff), "4" (kitchenstaff)
        const keycloakRoles = decoded.realm_access?.roles || []
        
        let role_id = 3 // default: staff (3)
        let role_name = 'staff'
        
        if (keycloakRoles.includes('1')) {
          role_id = 1
          role_name = 'admin'
        } else if (keycloakRoles.includes('2')) {
          role_id = 2
          role_name = 'manager'
        } else if (keycloakRoles.includes('4')) {
          role_id = 4
          role_name = 'kitchenstaff'
        } else if (keycloakRoles.includes('3')) {
          role_id = 3
          role_name = 'staff'
        }

        // Trả về payload chuẩn khớp với middleware/controller cũ
        resolve({
          id: decoded.db_id ? parseInt(decoded.db_id) : decoded.sub, // db_id chứa database User ID
          username: decoded.preferred_username || '',
          full_name: decoded.name || null,
          role_id: role_id,
          role_name: role_name
        })
      }
    })
  })
}

module.exports = {
  verifyToken
}