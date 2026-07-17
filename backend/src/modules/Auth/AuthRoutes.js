// backend/src/routes/authRoutes.js
// Tầng ROUTES: chỉ định tuyến và gắn middleware chặn cửa.
// Tuyệt đối không chứa logic nghiệp vụ.

const express        = require('express')
const router         = express.Router()
const authController = require('./AuthController')
const { requireAuth } = require('../../middlewares/Authmiddleware')

// POST /api/auth/login  → không cần token (đang chưa đăng nhập)
router.post('/login', authController.login)

// POST /api/auth/logout → không cần token (JWT stateless, frontend tự xoá)
router.post('/logout', authController.logout)

// POST /api/auth/refresh → lấy access token mới từ refresh token cookie
router.post('/refresh', authController.refresh)

// GET  /api/auth/me     → phải có token hợp lệ
router.get('/me', requireAuth, authController.getMe)

module.exports = router