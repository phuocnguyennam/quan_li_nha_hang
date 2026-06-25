// backend/src/controllers/reservationController.js
const repo = require('../repositories')

/**
 * GET /api/reservations
 * Query: ?date=YYYY-MM-DD (optional filter)
 */
async function listReservations(req, res) {
  try {
    const { date } = req.query
    let reservations = await repo.getReservations()

    if (date) {
      reservations = reservations.filter(r => {
        // reserved_time là DateTime2 → mssql trả về JS Date
        const dt = r.reserved_time ? new Date(r.reserved_time) : null
        if (!dt || isNaN(dt)) return false
        // en-CA locale cho "YYYY-MM-DD" không bị timezone shift
        return dt.toLocaleDateString('en-CA') === date
      })
    }

    return res.json({ data: reservations })
  } catch (err) {
    console.error('[reservationController] listReservations:', err)
    return res.status(500).json({ message: 'Failed to fetch reservations.' })
  }
}

/**
 * GET /api/reservations/:id
 */
async function getReservation(req, res) {
  try {
    const reservation = await repo.getReservation(req.params.id)
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' })
    }
    return res.json({ data: reservation })
  } catch (err) {
    console.error('[reservationController] getReservation:', err)
    return res.status(500).json({ message: 'Failed to fetch reservation.' })
  }
}

/**
 * POST /api/reservations
 * Body: { table_id, customer_name, phone, date, time }
 *   - date: "YYYY-MM-DD"
 *   - time: "HH:mm" (24h)
 *
 * Adapter: gộp date + time → reserved_time (JS Date / SQL DateTime2)
 * vì repository.addReservation chỉ nhận: table_id, customer_name, phone, reserved_time
 */
async function createReservation(req, res) {
  try {
    const { table_id, customer_name, phone, date, time } = req.body

    // 1. Validate required fields — chỉ những field repo thực sự dùng
    if (!table_id || !customer_name || !phone || !date || !time) {
      return res.status(400).json({
        message: 'Missing required fields: table_id, customer_name, phone, date, time.',
      })
    }

    // 2. Gộp date + time → một JS Date (DateTime2 compatible)
    //    Dùng "YYYY-MM-DDTHH:mm:00" để tránh timezone shift
    const reserved_time = new Date(`${date}T${time}:00`)
    if (isNaN(reserved_time.getTime())) {
      return res.status(400).json({ message: 'Invalid date or time format.' })
    }

    // 3. Validate không đặt quá khứ
    if (reserved_time < new Date()) {
      return res.status(400).json({ message: 'Cannot book a past date or time.' })
    }

    // 4. Conflict check — cùng bàn + cùng reserved_time (so sánh đến phút)
    //    repo trả về reserved_time là JS Date → getTime() để so sánh chính xác
    const existing = await repo.getReservationsByTable(table_id)
    const conflict = existing.find(r => {
      if (!r.reserved_time) return false
      const rDT = new Date(r.reserved_time)
      // Cắt giây/ms: so sánh đến từng phút
      return (
        rDT.getFullYear()  === reserved_time.getFullYear()  &&
        rDT.getMonth()     === reserved_time.getMonth()     &&
        rDT.getDate()      === reserved_time.getDate()      &&
        rDT.getHours()     === reserved_time.getHours()     &&
        rDT.getMinutes()   === reserved_time.getMinutes()
      )
    })

    if (conflict) {
      return res.status(409).json({
        message: 'This table is already booked at the selected date and time. Please choose a different time or table.',
      })
    }

    // 5. Tạo reservation — chỉ truyền đúng những field repo.addReservation nhận
    const created = await repo.addReservation({
      table_id:      Number(table_id),
      customer_name: String(customer_name).trim(),
      phone:         String(phone).trim(),
      reserved_time,           // JS Date → mssql tự cast sang DateTime2
    })

    return res.status(201).json({ data: created, message: 'Reservation created.' })
  } catch (err) {
    console.error('[reservationController] createReservation:', err)
    return res.status(500).json({ message: 'Failed to create reservation.' })
  }
}

/**
 * PUT /api/reservations/:id
 */
async function updateReservation(req, res) {
  try {
    const existing = await repo.getReservation(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Reservation not found.' })
    }

    const updated = await repo.updateReservation(req.params.id, req.body)
    return res.json({ data: updated, message: 'Reservation updated.' })
  } catch (err) {
    console.error('[reservationController] updateReservation:', err)
    return res.status(500).json({ message: 'Failed to update reservation.' })
  }
}

/**
 * DELETE /api/reservations/:id
 */
async function deleteReservation(req, res) {
  try {
    const existing = await repo.getReservation(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Reservation not found.' })
    }

    await repo.deleteReservation(req.params.id)
    return res.json({ message: 'Reservation deleted.' })
  } catch (err) {
    console.error('[reservationController] deleteReservation:', err)
    return res.status(500).json({ message: 'Failed to delete reservation.' })
  }
}

module.exports = {
  listReservations,
  getReservation,
  createReservation,
  updateReservation,
  deleteReservation,
}