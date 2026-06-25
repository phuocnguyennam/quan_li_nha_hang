// frontend/src/services/tableService.js
// Fetch wrapper cho Table API

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token') || ''
}

function buildHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

/** Normalize 1 table object từ SQL → UI shape */
function normalizeTable(raw) {
  return {
    id:       raw.id,
    code:     raw.code,
    name:     raw.name,
    areaId:   raw.area_id,
    areaName: raw.area_name || '',
    capacity: raw.capacity,
    seats:    raw.seats,
    status:   raw.status,
  }
}

/**
 * Lấy danh sách bàn đang Available
 * @returns {Promise<Table[]>}
 */
export async function fetchAvailableTables() {
  const res = await fetch(`${BASE_URL}/api/tables?status=Available`, {
    method: 'GET',
    headers: buildHeaders(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  const { data } = await res.json()
  return (data || []).map(normalizeTable)
}

/**
 * Lấy tất cả bàn
 * @returns {Promise<Table[]>}
 */
export async function fetchTables() {
  const res = await fetch(`${BASE_URL}/api/tables`, {
    method: 'GET',
    headers: buildHeaders(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  const { data } = await res.json()
  return (data || []).map(normalizeTable)
}