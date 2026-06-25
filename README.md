# Intro2SE_Group-11
Intro2SE_Group-11/
├── .git/
├── backend/
│   ├── .env
│   └── src/
│       ├── config/
│       │   └── db.js
│       ├── controllers/
│       │   ├── Authcontroller.js
│       │   ├── Reservationcontroller.js
│       │   ├── Tablecontroller.js
│       │   └── Usercontroller.js
│       ├── middlewares/
│       │   ├── Authmiddleware.js
│       │   └── RequireAuth.js
│       ├── repositories/
│       │   ├── Index.js
│       │   ├── Ingredientrepository.js
│       │   ├── Invoicerepository.js
│       │   ├── Orderrepository.js
│       │   ├── Productrepository.js
│       │   ├── Reciperepository.js
│       │   ├── Reservationrepository.js
│       │   ├── Rolerepository.js
│       │   ├── Tablerepository.js
│       │   └── Userrepository.js
│       ├── routes/
│       │   ├── Authroutes.js
│       │   ├── reservationRoutes.js
│       │   ├── Tableroutes.js
│       │   └── Userroutes.js
│       ├── utils/
│       │   ├── Jwtutils.js
│       │   └── Passwordutils.js
│       └── App.js
├── Eleven2Eleven_RMS/
│   ├── .gitignore
│   ├── clear-migration.js
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── jsconfig.json
│   ├── package-lock.json
│   ├── package.json
│   ├── vite.config.js
│   ├── README.md
│   ├── public/
│   │   └── vite.svg
│   └── src/
│       ├── assets/
│       │   ├── e2e.svg
│       │   └── react.svg
│       ├── components/
│       │   ├── auth/
│       │   │   └── RequireAuth.jsx
│       │   ├── custom/
│       │   │   ├── RoleCombobox.jsx
│       │   │   ├── Side_Navbar.jsx
│       │   │   └── User.jsx
│       │   └── ui/
│       │       ├── button.jsx, card.jsx, checkbox.jsx, command.jsx, dialog.jsx
│       │       ├── field.jsx, input-group.jsx, input.jsx, label.jsx, popover.jsx
│       │       └── select.jsx, separator.jsx, textarea.jsx
│       ├── contexts/
│       │   ├── AuthContext.jsx
│       │   ├── OrderContext.jsx
│       │   └── TableContext.jsx
│       ├── lib/
│       │   └── utils.js
│       ├── pages/
│       │   ├── EditRecipe.jsx
│       │   ├── IngredientManagement.jsx
│       │   ├── Kitchen.jsx
│       │   ├── Login.jsx
│       │   ├── MenuManagement.jsx
│       │   ├── Order.jsx
│       │   ├── PaymentDashboard.jsx
│       │   ├── SeatingManagement.jsx
│       │   ├── TableInfo.jsx
│       │   ├── TableReservation.jsx
│       │   └── UserManagement.jsx
│       ├── services/
│       │   ├── Authservice.js
│       │   ├── TableInfoService.js
│       │   ├── tableService.js
│       │   └── UserManagementService.js
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── package-lock.json
└── README.md

# Mô tả dự án
Xây dựng 1 hệ thống quản lí nhà hàng 

# Use case:

## Luồng Xử Lý Dữ Liệu: Use Case Đăng Nhập (Login)

Chức năng Đăng nhập được thiết kế theo kiến trúc Client-Server, phân tách rõ ràng giữa tầng hiển thị (View), tầng quản lý trạng thái (Context), tầng gọi API (Service) ở Frontend và kiến trúc Route-Controller-Repository ở Backend.

### Sơ đồ luồng đi của dữ liệu

**[Người dùng]** │ (1. Nhập Username/Password & Bấm Login)
   ▼
**[Login.jsx]** (Giao diện & Validate UX)
   │ (2. Gọi hàm login)
   ▼
**[AuthContext.jsx]** (Quản lý State)
   │ (3. Gọi apiLogin)
   ▼
**[Authservice.js]** (Gọi HTTP POST /api/auth/login)
   │ (4. Gửi Request)
   ▼
**[App.js]** ──> **[Authroutes.js]** (Định tuyến Backend)
   │ (5. Chuyển hướng tới Controller)
   ▼
**[Authcontroller.js]** (Xử lý nghiệp vụ chính)
   │  ├──> **[Userrepository.js]**: Truy vấn DB lấy thông tin User (getUserByUsername)
   │  ├──> **[Passwordutils.js]**: Băm & So sánh mật khẩu (verifyPassword bằng PBKDF2)
   │  └──> **[Jwtutils.js]**: Tạo JWT Token (signToken)
   │ (6. Trả về Token + User Payload)
   ▼
**[Authservice.js]** ──> **[AuthContext.jsx]**
   │ (7. Lưu `token` & `authUser` vào `localStorage`, cập nhật State)
   ▼
**[Login.jsx]** │ (8. Điều hướng người dùng sang `/dashboard`)
   ▼
**[Thành công]**


### Chi tiết các bước thực hiện:

#### 1. Frontend: Tương tác người dùng (`Login.jsx`)
- Người dùng nhập `username`, `password` và tuỳ chọn `Remember Me`.
- Hàm `validate()` chạy phía client để kiểm tra xem các trường có bị bỏ trống hay không.
- Gửi dữ liệu thông qua hàm `login()` được lấy từ `AuthContext`.

#### 2. Frontend: Xử lý State & Gọi API (`AuthContext.jsx` & `Authservice.js`)
- `AuthContext` tiếp nhận yêu cầu và gọi hàm trung gian `apiLogin()` từ `authService.js`.
- `authService.js` sử dụng `fetch` để gửi một HTTP POST request đến endpoint `/api/auth/login` (của backend) chứa body là JSON `{ username, password, remember }`.
- Nếu có lỗi từ server, `authService.js` sẽ ném ra `Error` với thông báo từ backend để `Login.jsx` hiển thị lên UI.

#### 3. Backend: Định tuyến (`App.js` & `Authroutes.js`)
- Request đi qua `App.js` (đã được cấu hình CORS và body parser) và được định tuyến tới `/api/auth`.
- `Authroutes.js` bắt request `POST /login` và chuyển dữ liệu cho `authController.login` xử lý. (Lưu ý: Không yêu cầu Token ở bước này).

#### 4. Backend: Xử lý Nghiệp vụ Xác thực (`Authcontroller.js`)
Đây là trái tim của logic bảo mật:
- **Validate:** Kiểm tra định dạng `username` (3-50 ký tự, không chứa ký tự đặc biệt) và độ dài `password` (>= 4 ký tự).
- **Tìm User:** Gọi `getUserByUsername` từ `Userrepository.js` (truy vấn SQL Server). Trả về lỗi `401` nếu không tồn tại.
- **Kiểm tra trạng thái:** Đảm bảo tài khoản đang hoạt động (`status !== 0`) và đã được thiết lập mật khẩu (`hashed_password`, `salt` phải tồn tại).
- **Xác minh Mật khẩu:** Gọi `verifyPassword` từ `Passwordutils.js`. Hệ thống băm mật khẩu người dùng vừa nhập kết hợp với `salt` lấy từ DB, sau đó dùng thuật toán so sánh an toàn `timingSafeEqual` để chống lại các cuộc tấn công Timing Attack.
- **Cấp phát Token:** Nếu mật khẩu đúng, đóng gói thông tin (id, username, role...) thành payload và gọi `signToken` từ `Jwtutils.js` để ký JWT. Thời gian hết hạn của token phụ thuộc vào tuỳ chọn `Remember Me` (mặc định 8h, nếu Remember là 30 ngày).

#### 5. Frontend: Lưu trữ & Điều hướng (`AuthContext.jsx` & `Login.jsx`)
- Backend trả về HTTP Status 200 kèm `token` và thông tin `user`.
- `AuthContext` nhận kết quả, lưu `token` và `authUser` vào `localStorage`, đồng thời gọi `setUser()` để cập nhật state toàn app (giúp các component khác nhận biết user đã đăng nhập).
- `Login.jsx` hoàn tất Promise, lưu `username` vào `localStorage` nếu chọn "Remember Me" và dùng `useNavigate` điều hướng người dùng vào `/dashboard`.

