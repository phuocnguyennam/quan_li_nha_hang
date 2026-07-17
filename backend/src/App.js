// backend/src/app.js
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const express     = require('express')
const cors        = require('cors')
const cookieParser = require('cookie-parser')
const { getPool } = require('./config/db')

// ── Routes ────────────────────────────────────────────────────
const authRoutes        = require('./modules/Auth/AuthRoutes')
const userRoutes        = require('./modules/User/UserRoutes')
const seatingRoutes     = require('./modules/Seating/SeatingRoutes')
const reservationRoutes = require('./modules/Reservation/ReservationRoutes')
const ingredientRoutes  = require('./modules/Ingredient/IngredientRoutes')
const menuRoutes        = require('./modules/Menu/MenuRoutes')
const orderRoutes       = require('./modules/Order/OrderRoutes')
const invoiceRoutes     = require('./modules/Invoice/InvoiceRoutes')

const app  = express()
const PORT = process.env.PORT || 3000

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Mount Routes ─────────────────────────────────────────────
app.use('/api/auth',         authRoutes)
app.use('/api/users',        userRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api',              seatingRoutes)     // Mounts /api/tables and /api/areas
app.use('/api',              ingredientRoutes)  // Mounts /api/ingredients
app.use('/api',              menuRoutes)        // Mounts /api/products
app.use('/api',              orderRoutes)       // Mounts /api/orders
app.use('/api',              invoiceRoutes)     // Mounts /api/invoices

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' })
})

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err)
  res.status(500).json({ message: 'Internal server error.' })
})

// ── Start ─────────────────────────────────────────────────────
async function start() {
  try {
    await getPool()
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
      console.log(`   Frontend origin : ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err.message)
    process.exit(1)
  }
}

start()

module.exports = app