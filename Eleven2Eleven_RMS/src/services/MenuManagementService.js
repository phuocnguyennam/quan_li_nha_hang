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

export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export async function getProduct(id) {
  const res = await fetch(`${BASE_URL}/api/products/${id}`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export async function fetchCategories() {
  const res = await fetch(`${BASE_URL}/api/products/categories`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export async function addProduct(payload) {
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function updateProduct(id, payload) {
  const res = await fetch(`${BASE_URL}/api/products/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  await handleResponse(res)
  return true
}

export async function fetchRecipesForProduct(id) {
  const res = await fetch(`${BASE_URL}/api/products/${id}/recipes`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export { fetchProducts as getProducts, fetchCategories as getCategories, fetchRecipesForProduct as getRecipesForProduct }
export { getIngredients } from './IngredientManagementService'
