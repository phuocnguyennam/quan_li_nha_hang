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

export async function fetchIngredients() {
  const res = await fetch(`${BASE_URL}/api/ingredients`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export async function getIngredient(id) {
  const res = await fetch(`${BASE_URL}/api/ingredients/${id}`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export async function addIngredient(payload) {
  const res = await fetch(`${BASE_URL}/api/ingredients`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function updateIngredient(id, payload) {
  const res = await fetch(`${BASE_URL}/api/ingredients/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function deleteIngredient(id) {
  const res = await fetch(`${BASE_URL}/api/ingredients/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  await handleResponse(res)
  return true
}

export { fetchIngredients as getIngredients }
