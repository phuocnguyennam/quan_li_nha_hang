// backend/src/controllers/userController.js
// Nhiệm vụ: nhận Request → gọi Repository → trả Response
// Không chứa SQL, không chứa business logic phức tạp — chỉ điều phối

const repo                = require('./UserRepository')
const roleRepo            = require('./RoleRepository')
const { createPasswordHash } = require('../../utils/passwordUtils')

// ── GET /api/users ─────────────────────────────────────────────────────────
async function listUsers(req, res, next) {
  try {
    const users = await repo.getUsers()
    res.json(users)
  } catch (err) {
    next(err)
  }
}

// ── GET /api/users/:id ─────────────────────────────────────────────────────
async function getUser(req, res, next) {
  try {
    const id   = Number(req.params.id)
    const user = await repo.getUser(id)

    if (!user) return res.status(404).json({ message: 'User not found.' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// ── POST /api/users ────────────────────────────────────────────────────────
async function createUser(req, res, next) {
  try {
    const { name, full_name, email, password, role_id, status } = req.body
    // Validation cơ bản
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required.' })
    }

    // Kiểm tra username đã tồn tại chưa
    const existing = await repo.getUserByUsername(name)
    if (existing) {
      return res.status(409).json({ message: `Username "${name}" already exists.` })
    }

    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await repo.getUserByEmail(email)
    if (existingEmail) {
      return res.status(409).json({ message: `Email "${email}" already exists.` })
    }

    const { salt, hashed_password } = createPasswordHash(password)

    const created = await repo.addUser({
      name,
      full_name: full_name || null,
      email,
      hashed_password,
      salt,
      role_id: role_id != null ? Number(role_id) : null,
      status:  status  ?? 1,
    })

    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
}

// ── PUT /api/users/:id ─────────────────────────────────────────────────────
async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { name, full_name, email, password, role_id, status } = req.body
    // Kiểm tra user tồn tại
    const existing = await repo.getUser(id)
    if (!existing) return res.status(404).json({ message: 'User not found.' })

    // Nếu đổi username → kiểm tra trùng
    if (name && name !== existing.name) {
      const taken = await repo.getUserByUsername(name)
      if (taken) return res.status(409).json({ message: `Username "${name}" already exists.` })
    }

    // Nếu đổi email → kiểm tra trùng
    if (email && email !== existing.email) {
      const taken = await repo.getUserByEmail(email)
      if (taken) return res.status(409).json({ message: `Email "${email}" already exists.` })
    }

    const updateData = {}
    if (name      !== undefined) updateData.name      = name
    if (full_name !== undefined) updateData.full_name = full_name
    if (email     !== undefined) updateData.email     = email
    if (role_id   !== undefined) updateData.role_id   = role_id != null ? Number(role_id) : null
    if (status    !== undefined) updateData.status    = status

    // Nếu có password mới → hash lại
    if (password) {
      const { salt, hashed_password } = createPasswordHash(password)
      updateData.hashed_password = hashed_password
      updateData.salt            = salt
    }

    const updated = await repo.updateUser(id, updateData)
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

// ── DELETE /api/users/:id ──────────────────────────────────────────────────
async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id)

    // Không cho tự xóa chính mình
    if (req.user && req.user.id === id) {
      return res.status(400).json({ message: 'Cannot delete your own account.' })
    }

    const existing = await repo.getUser(id)
    if (!existing) return res.status(404).json({ message: 'User not found.' })

    await repo.deleteUser(id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// ── GET /api/roles ──────────────────────────────────────────────────────────
async function listRoles(req, res, next) {
  try {
    const roles = await roleRepo.getRoles()
    res.json(roles)
  } catch (err) {
    next(err)
  }
}

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser, listRoles }