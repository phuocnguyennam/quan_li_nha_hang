// Eleven2Eleven_RMS/src/services/fetchInterceptor.js
// Ghi đè hàm fetch toàn cục để thêm credentials: 'include' và tự động làm mới access token khi hết hạn.

const originalFetch = window.fetch

window.fetch = async function (input, init = {}) {
  let url = ''
  if (typeof input === 'string') {
    url = input
  } else if (input && typeof input === 'object' && 'url' in input) {
    url = input.url
  }

  const isApiCall = url.includes('/api/')

  if (isApiCall) {
    // Luôn thêm credentials: 'include' để truyền nhận cookie cùng CORS
    init.credentials = 'include'
  }

  let response = await originalFetch(input, init)

  // Nếu gặp lỗi 401 Unauthorized và đây là cuộc gọi API thông thường
  // (ngoại trừ login, refresh, logout để tránh vòng lặp vô tận)
  if (
    response.status === 401 &&
    isApiCall &&
    !url.includes('/auth/login') &&
    !url.includes('/auth/refresh') &&
    !url.includes('/auth/logout')
  ) {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const refreshRes = await originalFetch(`${apiBaseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (refreshRes.ok) {
        // Làm mới thành công, thực hiện lại request ban đầu với cookie mới
        response = await originalFetch(input, init)
      } else {
        // Refresh token cũng đã hết hạn/vô hiệu -> tiến hành đăng xuất
        localStorage.removeItem('authUser')
        localStorage.removeItem('isLoggedIn')
        window.dispatchEvent(new Event('auth-expired'))
      }
    } catch (err) {
      console.error('[Fetch Interceptor] Lỗi làm mới token tự động:', err)
    }
  }

  return response
}
