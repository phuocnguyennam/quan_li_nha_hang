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

function normalizeTable(raw) {
  return {
    id:       raw.id,
    code:     raw.code,
    name:     raw.name,
    areaId:   raw.area_id ?? raw.areaId ?? null,
    areaName: raw.area_name || raw.areaName || '',
    capacity: Number(raw.capacity || raw.seats || 0),
    seats:    Number(raw.seats || raw.capacity || 0),
    status:   raw.status || 'Available',
    reservationTime: raw.reservation_time || raw.reservationTime || null,
  }
}

function normalizeArea(raw) {
  return {
    id: raw.id,
    name: raw.name || `Area ${raw.id}`,
  }
}

async function handleResponse(res) {
  if (res.status === 204) {
    return null
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.message || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Tables API ────────────────────────────────────────────────
export async function fetchTables() {
  const res = await fetch(`${BASE_URL}/api/tables`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  const { data } = await handleResponse(res)
  return (data || []).map(normalizeTable)
}

export async function createTable(payload) {
  const res = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  const { data } = await handleResponse(res)
  return normalizeTable(data)
}

export async function updateTable(id, payload) {
  const res = await fetch(`${BASE_URL}/api/tables/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  const { data } = await handleResponse(res)
  return normalizeTable(data)
}

export async function deleteTable(id) {
  const res = await fetch(`${BASE_URL}/api/tables/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  await handleResponse(res)
  return true
}

// ── Areas API ─────────────────────────────────────────────────
export async function fetchAreas() {
  const res = await fetch(`${BASE_URL}/api/areas`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  const { data } = await handleResponse(res)
  return (data || []).map(normalizeArea)
}

export async function createArea(payload) {
  const res = await fetch(`${BASE_URL}/api/areas`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  const { data } = await handleResponse(res)
  return normalizeArea(data)
}

export async function updateArea(id, payload) {
  const res = await fetch(`${BASE_URL}/api/areas/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  const { data } = await handleResponse(res)
  return normalizeArea(data)
}

export async function deleteArea(id) {
  const res = await fetch(`${BASE_URL}/api/areas/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  await handleResponse(res)
  return true
}
