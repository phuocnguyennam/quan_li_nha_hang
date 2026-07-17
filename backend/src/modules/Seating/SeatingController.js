// backend/src/modules/Seating/SeatingController.js
const repo = require('./SeatingRepository')

// ─────────────────────────────────────────────────────────────
//  TABLE CONTROLLERS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/tables
 * Query: ?status=Available|Occupied|Reserved  (optional)
 *        ?area_id=<number>                     (optional)
 */
async function listTables(req, res) {
  try {
    const { status, area_id } = req.query
    let tables

    if (status) {
      tables = await repo.getTablesByStatus(status)
    } else if (area_id) {
      tables = await repo.getTablesByArea(Number(area_id))
    } else {
      tables = await repo.getTables()
    }

    return res.json({ data: tables })
  } catch (err) {
    console.error('[SeatingController] listTables:', err)
    return res.status(500).json({ message: 'Failed to fetch tables.' })
  }
}

/**
 * GET /api/tables/:id
 */
async function getTable(req, res) {
  try {
    const table = await repo.getTable(req.params.id)
    if (!table) return res.status(404).json({ message: 'Table not found.' })
    return res.json({ data: table })
  } catch (err) {
    console.error('[SeatingController] getTable:', err)
    return res.status(500).json({ message: 'Failed to fetch table.' })
  }
}

/**
 * POST /api/tables
 * Body: { code, name, area_id, capacity, seats, status? }
 */
async function createTable(req, res) {
  try {
    const { code, name, area_id, capacity, seats, status } = req.body
    if (!code || !name || !area_id) {
      return res.status(400).json({ message: 'Missing required fields: code, name, area_id.' })
    }
    const created = await repo.addTable({ code, name, area_id, capacity, seats, status })
    return res.status(201).json({ data: created, message: 'Table created.' })
  } catch (err) {
    console.error('[SeatingController] createTable:', err)
    return res.status(500).json({ message: 'Failed to create table.' })
  }
}

/**
 * PUT /api/tables/:id
 */
async function updateTable(req, res) {
  try {
    const existing = await repo.getTable(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Table not found.' })

    const updated = await repo.updateTable(req.params.id, req.body)
    return res.json({ data: updated, message: 'Table updated.' })
  } catch (err) {
    console.error('[SeatingController] updateTable:', err)
    return res.status(500).json({ message: 'Failed to update table.' })
  }
}

/**
 * PATCH /api/tables/:id/status
 * Body: { status: 'Available' | 'Occupied' | 'Reserved' }
 */
async function updateTableStatus(req, res) {
  try {
    const { status } = req.body
    const VALID = ['Available', 'Occupied', 'Reserved']
    if (!status || !VALID.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID.join(', ')}.` })
    }

    const existing = await repo.getTable(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Table not found.' })

    const updated = await repo.updateTableStatus(req.params.id, status)
    return res.json({ data: updated, message: 'Table status updated.' })
  } catch (err) {
    console.error('[SeatingController] updateTableStatus:', err)
    return res.status(500).json({ message: 'Failed to update table status.' })
  }
}

/**
 * DELETE /api/tables/:id
 */
async function deleteTable(req, res) {
  try {
    const existing = await repo.getTable(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Table not found.' })

    await repo.deleteTable(req.params.id)
    return res.json({ message: 'Table deleted.' })
  } catch (err) {
    console.error('[SeatingController] deleteTable:', err)
    return res.status(500).json({ message: 'Failed to delete table.' })
  }
}

// ─────────────────────────────────────────────────────────────
//  AREA CONTROLLERS
// ─────────────────────────────────────────────────────────────

/** GET /api/areas */
async function listAreas(req, res) {
  try {
    const areas = await repo.getAreas()
    return res.json({ data: areas })
  } catch (err) {
    console.error('[SeatingController] listAreas:', err)
    return res.status(500).json({ message: 'Failed to load areas.' })
  }
}

/** GET /api/areas/:id */
async function getArea(req, res) {
  try {
    const area = await repo.getArea(req.params.id)
    if (!area) return res.status(404).json({ message: 'Area not found.' })
    return res.json({ data: area })
  } catch (err) {
    console.error('[SeatingController] getArea:', err)
    return res.status(500).json({ message: 'Failed to load area.' })
  }
}

/** POST /api/areas */
async function createArea(req, res) {
  try {
    const { name } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Area name is required.' })
    }
    const created = await repo.addArea({ name: String(name).trim() })
    return res.status(201).json({ data: created })
  } catch (err) {
    console.error('[SeatingController] createArea:', err)
    return res.status(500).json({ message: 'Failed to create area.' })
  }
}

/** PUT /api/areas/:id */
async function updateArea(req, res) {
  try {
    const { name } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Area name is required.' })
    }
    const existing = await repo.getArea(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Area not found.' })
    const updated = await repo.updateArea(req.params.id, { name: String(name).trim() })
    return res.json({ data: updated })
  } catch (err) {
    console.error('[SeatingController] updateArea:', err)
    return res.status(500).json({ message: 'Failed to update area.' })
  }
}

/** DELETE /api/areas/:id */
async function deleteArea(req, res) {
  try {
    const existing = await repo.getArea(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Area not found.' })
    await repo.deleteArea(req.params.id)
    return res.status(204).end()
  } catch (err) {
    console.error('[SeatingController] deleteArea:', err)
    return res.status(500).json({ message: 'Failed to delete area.' })
  }
}

module.exports = {
  // Tables
  listTables,
  getTable,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  // Areas
  listAreas,
  getArea,
  createArea,
  updateArea,
  deleteArea,
}