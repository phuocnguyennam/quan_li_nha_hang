// frontend/src/services/TableInfoService.js
// Fetch wrapper + response normalizer cho Reservation
// Không dùng axios — dùng native fetch

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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

/**
 * Normalize 1 reservation object từ SQL → UI shape
 * SQL columns: id, table_id, table_name (join), customer_name,
 *              phone, guests, date, time, status
 */
/**
 * Normalize 1 reservation object từ SQL → UI shape
 * SQL column chính: reserved_time (DateTime2) — gộp cả date lẫn time
 *
 * reserved_time được mssql driver trả về dưới dạng JS Date
 * → tách ra date "YYYY-MM-DD" và time "HH:mm AM/PM" để hiển thị
 */
function normalizeReservation(raw) {
  // reserved_time: JS Date (mssql) hoặc ISO string
  const dt = raw.reserved_time ? new Date(raw.reserved_time) : null

  const date = dt && !isNaN(dt)
    ? dt.toLocaleDateString('en-CA')           // "YYYY-MM-DD" — locale en-CA không bị timezone shift
    : (raw.date ? String(raw.date).split('T')[0] : '--')

  const time = dt && !isNaN(dt)
    ? formatDisplayTime(
        `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
      )
    : formatDisplayTime(raw.time || '--:--')

  return {
    id:           raw.id,
    tableId:      raw.table_id,
    tableNumber:  raw.table_name || raw.table_code || `Table ${raw.table_id}`,
    customerName: raw.customer_name || 'Unknown',
    phoneNumber:  raw.phone         || 'N/A',
    date,
    time,
    status:       raw.status || 'Confirmed',
  }
}

/** "13:30:00" / "13:30" → "01:30 PM" */
function formatDisplayTime(timeStr) {
  if (!timeStr || timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
  const [hours, minutes] = timeStr.split(':')
  if (!hours || !minutes) return timeStr
  let h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`
}

// ─────────────────────────────────────────────
// API calls
// ─────────────────────────────────────────────

/**
 * Lấy danh sách đặt bàn
 * @param {string} [date] - "YYYY-MM-DD" — filter theo ngày (optional)
 * @returns {Promise<Reservation[]>}
 */
export async function fetchReservations(date) {
  const url = new URL(`${BASE_URL}/api/reservations`)
  if (date) url.searchParams.set('date', date)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  const { data } = await res.json()
  return (data || [])
    .filter(r => r.customer_name && String(r.customer_name).trim() !== '')
    .map(normalizeReservation)
    .reverse()
}

/**
 * Tạo đặt bàn mới — backend sẽ kiểm tra conflict
 * @param {{
 *   table_id:       number,
 *   customer_name:  string,
 *   phone:          string,
 *   guests:         number,
 *   date:           string,   // "YYYY-MM-DD"
 *   time:           string,   // "HH:mm" (24h) — backend tự format
 *   status?:        string,
 * }} payload
 * @throws {Error} với isConflict=true khi bàn đã được đặt cùng ngày giờ (HTTP 409)
 */
export async function createReservation(payload) {
  const res = await fetch(`${BASE_URL}/api/reservations`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })

  if (res.status === 409) {
    // Conflict — bàn đã được đặt vào slot này
    const err = await res.json().catch(() => ({}))
    const conflictErr = new Error(err.message || 'This table is already booked at the selected date and time.')
    conflictErr.isConflict = true
    throw conflictErr
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  const { data } = await res.json()
  return normalizeReservation(data)
}

/**
 * Xoá (huỷ) một đặt bàn
 * @param {number|string} id
 */
export async function cancelReservation(id) {
  const res = await fetch(`${BASE_URL}/api/reservations/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  return true
}

/**
 * Cập nhật đặt bàn
 * @param {number|string} id
 * @param {Partial<{table_id, customer_name, phone, guests, date, time, status}>} payload
 */
export async function updateReservation(id, payload) {
  const res = await fetch(`${BASE_URL}/api/reservations/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  const { data } = await res.json()
  return normalizeReservation(data)
}