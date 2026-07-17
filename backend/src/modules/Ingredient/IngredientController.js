const repo = require('./IngredientRepository')

async function listIngredients(req, res) {
  try {
    const ingredients = await repo.getIngredients()
    return res.json(ingredients)
  } catch (err) {
    console.error('[IngredientController] listIngredients:', err)
    return res.status(500).json({ message: 'Failed to fetch ingredients.' })
  }
}

async function getIngredient(req, res) {
  try {
    const id = Number(req.params.id)
    const ingredient = await repo.getIngredient(id)
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found.' })
    }
    return res.json(ingredient)
  } catch (err) {
    console.error('[IngredientController] getIngredient:', err)
    return res.status(500).json({ message: 'Failed to fetch ingredient.' })
  }
}

async function createIngredient(req, res) {
  try {
    const { name, quantity, unit } = req.body
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' })
    }
    const created = await repo.addIngredient({ name, quantity, unit })
    return res.status(201).json(created)
  } catch (err) {
    console.error('[IngredientController] createIngredient:', err)
    return res.status(500).json({ message: 'Failed to create ingredient.' })
  }
}

async function updateIngredient(req, res) {
  try {
    const id = Number(req.params.id)
    const existing = await repo.getIngredient(id)
    if (!existing) {
      return res.status(404).json({ message: 'Ingredient not found.' })
    }
    const updated = await repo.updateIngredient(id, req.body)
    return res.json(updated)
  } catch (err) {
    console.error('[IngredientController] updateIngredient:', err)
    return res.status(500).json({ message: 'Failed to update ingredient.' })
  }
}

async function deleteIngredient(req, res) {
  try {
    const id = Number(req.params.id)
    const existing = await repo.getIngredient(id)
    if (!existing) {
      return res.status(404).json({ message: 'Ingredient not found.' })
    }
    await repo.deleteIngredient(id)
    return res.status(204).end()
  } catch (err) {
    console.error('[IngredientController] deleteIngredient:', err)
    return res.status(500).json({ message: 'Failed to delete ingredient.' })
  }
}

module.exports = {
  listIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
}