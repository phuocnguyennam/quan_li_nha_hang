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

export async function fetchProduct(id) {
  const res = await fetch(`${BASE_URL}/api/products/${id}`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export { getIngredients } from './IngredientManagementService'

export async function fetchRecipesForProduct(productId) {
  const res = await fetch(`${BASE_URL}/api/products/${productId}/recipes`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export async function setRecipe(productId, ingredientId, payload) {
  const res = await fetch(`${BASE_URL}/api/products/${productId}/recipes`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      ingredient_id: ingredientId,
      quantity: payload.quantity ?? payload.amount ?? 0
    }),
  })
  return handleResponse(res)
}

export async function deleteRecipe(productId, ingredientId) {
  const res = await fetch(`${BASE_URL}/api/products/${productId}/recipes/${ingredientId}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  await handleResponse(res)
  return true
}

export { fetchProduct as getProduct, fetchRecipesForProduct as getRecipesForProduct }
