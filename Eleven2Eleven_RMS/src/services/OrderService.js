const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token') || ''
}

function buildHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse(res) {
  if (res.status === 204) return null
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function fetchOrders() {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export async function addOrder(payload) {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}
