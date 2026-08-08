// backend/src/utils/KeycloakAdminUtils.js
const axios = require('axios')

const KEYCLOAK_SERVER_URL = process.env.KEYCLOAK_SERVER_URL || 'http://keycloak.keycloak.svc.cluster.local'
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'master'
const KEYCLOAK_ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER || 'admin'
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'KeycloakAdminSecretPassword123!'

/**
 * Lấy Admin Access Token từ Keycloak (realm master, client admin-cli)
 * @returns {Promise<string>}
 */
async function getAdminAccessToken() {
  const params = new URLSearchParams()
  params.append('grant_type', 'password')
  params.append('client_id', 'admin-cli')
  params.append('username', KEYCLOAK_ADMIN_USER)
  params.append('password', KEYCLOAK_ADMIN_PASSWORD)

  const response = await axios.post(
    `${KEYCLOAK_SERVER_URL}/realms/master/protocol/openid-connect/token`,
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )

  return response.data.access_token
}

/**
 * Tạo User mới trong Keycloak và gán Role
 * @param {object} param0 { username, email, password, role_id }
 */
async function createKeycloakUser({ username, email, password, role_id }) {
  try {
    const token = await getAdminAccessToken()
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    // 1. Tạo User trong Keycloak
    const userPayload = {
      username,
      email,
      enabled: true,
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false
        }
      ]
    }

    await axios.post(
      `${KEYCLOAK_SERVER_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
      userPayload,
      { headers }
    )

    // 2. Lấy Keycloak User ID vừa tạo
    const usersResponse = await axios.get(
      `${KEYCLOAK_SERVER_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${encodeURIComponent(username)}`,
      { headers }
    )

    const createdUser = usersResponse.data.find(u => u.username === username)
    if (!createdUser) return

    // 3. Gán Role cho User (nếu có role_id)
    if (role_id != null) {
      const roleName = String(role_id) // "1", "2", "3", "4"
      try {
        // Lấy thông tin role từ Keycloak
        const roleResponse = await axios.get(
          `${KEYCLOAK_SERVER_URL}/admin/realms/${KEYCLOAK_REALM}/roles/${encodeURIComponent(roleName)}`,
          { headers }
        )
        const roleData = roleResponse.data

        // Add role vào user
        await axios.post(
          `${KEYCLOAK_SERVER_URL}/admin/realms/${KEYCLOAK_REALM}/users/${createdUser.id}/role-mappings/realm`,
          [roleData],
          { headers }
        )
      } catch (roleErr) {
        console.warn(`[KeycloakAdminUtils] Warning assigning role "${roleName}":`, roleErr.message)
      }
    }

    return createdUser
  } catch (err) {
    console.error('[KeycloakAdminUtils] Error creating user in Keycloak:', err.response?.data || err.message)
    throw new Error(err.response?.data?.errorMessage || 'Failed to create user in Keycloak.')
  }
}

/**
 * Đổi mật khẩu của User trong Keycloak
 * @param {string} username
 * @param {string} newPassword
 */
async function updateKeycloakUserPassword(username, newPassword) {
  try {
    const token = await getAdminAccessToken()
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    // Lấy Keycloak User ID
    const usersResponse = await axios.get(
      `${KEYCLOAK_SERVER_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${encodeURIComponent(username)}`,
      { headers }
    )

    const targetUser = usersResponse.data.find(u => u.username === username)
    if (!targetUser) return

    // Reset password
    await axios.put(
      `${KEYCLOAK_SERVER_URL}/admin/realms/${KEYCLOAK_REALM}/users/${targetUser.id}/reset-password`,
      {
        type: 'password',
        value: newPassword,
        temporary: false
      },
      { headers }
    )
  } catch (err) {
    console.error('[KeycloakAdminUtils] Error updating password in Keycloak:', err.response?.data || err.message)
    throw new Error('Failed to update password in Keycloak.')
  }
}

/**
 * Xóa User khỏi Keycloak
 * @param {string} username
 */
async function deleteKeycloakUser(username) {
  try {
    const token = await getAdminAccessToken()
    const headers = { Authorization: `Bearer ${token}` }

    const usersResponse = await axios.get(
      `${KEYCLOAK_SERVER_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${encodeURIComponent(username)}`,
      { headers }
    )

    const targetUser = usersResponse.data.find(u => u.username === username)
    if (!targetUser) return

    await axios.delete(
      `${KEYCLOAK_SERVER_URL}/admin/realms/${KEYCLOAK_REALM}/users/${targetUser.id}`,
      { headers }
    )
  } catch (err) {
    console.warn('[KeycloakAdminUtils] Error deleting user in Keycloak:', err.response?.data || err.message)
  }
}

module.exports = {
  getAdminAccessToken,
  createKeycloakUser,
  updateKeycloakUserPassword,
  deleteKeycloakUser
}
