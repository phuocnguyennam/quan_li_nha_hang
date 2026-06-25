// backend/src/config/db.js
const sql = require('mssql')

const config = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt:                process.env.DB_ENCRYPT    === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
  },
  pool: {
    max:              10,
    min:              0,
    idleTimeoutMillis: 30000,
  },
}

// ─────────────────────────────────────────────────────────────
//  Pool singleton
//  Lỗi cũ: gọi sql.connect() mỗi lần → race condition khi
//  nhiều request đến đồng thời trước khi pool sẵn sàng.
//  Fix: lưu Promise khởi tạo vào poolPromise, mọi caller
//  await cùng một Promise — pool chỉ tạo đúng 1 lần.
// ─────────────────────────────────────────────────────────────
let poolPromise = null

function getPool() {
  if (!poolPromise) {
    poolPromise = sql
      .connect(config)
      .then((pool) => {
        console.log('✅ Connected to SQL Server —', config.database)

        // Reset khi pool bị đóng ngoài ý muốn
        pool.on('error', (err) => {
          console.error('❌ Pool error:', err.message)
          poolPromise = null
        })

        return pool
      })
      .catch((err) => {
        // Cho phép thử lại lần sau nếu kết nối thất bại
        poolPromise = null
        console.error('❌ SQL Server connection failed:', err.message)
        throw err
      })
  }
  return poolPromise
}

// ─────────────────────────────────────────────────────────────
//  query(queryString, params)
//
//  Lỗi cũ: request.input(key, value) truyền nguyên object
//  { type, value } vào mssql → mssql nhận sai kiểu dữ liệu,
//  query trả về lỗi hoặc kết quả rỗng.
//
//  Fix: tách { type, value } ra trước khi gọi request.input()
//  — mssql yêu cầu đúng dạng: request.input(name, type, value)
//
//  Cú pháp params (giống toàn bộ repository đang dùng):
//  {
//    id:       { type: sql.Int,          value: 1       },
//    username: { type: sql.NVarChar(50), value: 'admin' },
//    status:   { type: sql.TinyInt,      value: 1       },
//  }
// ─────────────────────────────────────────────────────────────
async function query(queryString, params = {}) {
  const pool    = await getPool()
  const request = pool.request()

  for (const [key, param] of Object.entries(params)) {
    // Phân biệt 2 dạng truyền vào:
    // - Dạng đúng (repositories): { type: sql.Int, value: 1 }
    // - Dạng cũ (shorthand):      value trực tiếp (string, number...)
    if (param !== null && typeof param === 'object' && 'type' in param && 'value' in param) {
      request.input(key, param.type, param.value)   // ← FIX: tách type và value
    } else {
      // Fallback: truyền thẳng, mssql tự suy kiểu (không khuyến khích)
      request.input(key, param)
    }
  }

  return request.query(queryString)
}

// ─────────────────────────────────────────────────────────────
//  closePool — dùng khi shutdown server (graceful exit)
// ─────────────────────────────────────────────────────────────
async function closePool() {
  if (poolPromise) {
    try {
      const pool = await poolPromise
      await pool.close()
      console.log('🔌 SQL Server pool closed')
    } catch (err) {
      console.error('Error closing pool:', err.message)
    } finally {
      poolPromise = null
    }
  }
}

// Graceful shutdown khi process thoát
process.on('SIGINT',  async () => { await closePool(); process.exit(0) })
process.on('SIGTERM', async () => { await closePool(); process.exit(0) })

module.exports = { getPool, query, closePool, sql }