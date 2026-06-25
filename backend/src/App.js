// backend/src/app.js
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const express     = require('express')
const cors        = require('cors')
const { getPool } = require('./config/db')

// ── Routes ────────────────────────────────────────────────────
const authRoutes        = require('./routes/authRoutes')
const userRoutes        = require('./routes/userRoutes')
const tableRoutes       = require('./routes/tableRoutes')        // ⭐ mới
const reservationRoutes = require('./routes/reservationRoutes')  // ⭐ mới
// const productRoutes     = require('./routes/productRoutes')
// const orderRoutes       = require('./routes/orderRoutes')
// const ingredientRoutes  = require('./routes/ingredientRoutes')

const app  = express()
const PORT = process.env.PORT || 3000

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Mount Routes ─────────────────────────────────────────────
app.use('/api/auth',         authRoutes)
app.use('/api/users',        userRoutes)
app.use('/api/tables',       tableRoutes)       // ⭐ mới
app.use('/api/reservations', reservationRoutes) // ⭐ mới
// app.use('/api/products',     productRoutes)
// app.use('/api/orders',       orderRoutes)
// app.use('/api/ingredients',  ingredientRoutes)

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