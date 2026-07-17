const productRepo = require('./ProductRepository')
const recipeRepo  = require('./RecipeRepository')

// ── PRODUCTS ──────────────────────────────────────────────────

async function listProducts(req, res) {
  try {
    const products = await productRepo.getProducts()
    return res.json(products)
  } catch (err) {
    console.error('[MenuController] listProducts:', err)
    return res.status(500).json({ message: 'Failed to fetch products.' })
  }
}

async function getProduct(req, res) {
  try {
    const id = Number(req.params.id)
    const product = await productRepo.getProduct(id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    return res.json(product)
  } catch (err) {
    console.error('[MenuController] getProduct:', err)
    return res.status(500).json({ message: 'Failed to fetch product.' })
  }
}

async function listCategories(req, res) {
  try {
    const categories = await productRepo.getCategories()
    return res.json(categories)
  } catch (err) {
    console.error('[MenuController] listCategories:', err)
    return res.status(500).json({ message: 'Failed to fetch categories.' })
  }
}

async function createProduct(req, res) {
  try {
    const { name, category, description, price, preparation_time, image_url, available } = req.body
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' })
    }
    const created = await productRepo.addProduct({
      name,
      category,
      description,
      price: price != null ? Number(price) : 0,
      preparation_time: preparation_time != null ? Number(preparation_time) : null,
      image_url,
      available: available ?? 1,
    })
    return res.status(201).json(created)
  } catch (err) {
    console.error('[MenuController] createProduct:', err)
    return res.status(500).json({ message: 'Failed to create product.' })
  }
}

async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id)
    const existing = await productRepo.getProduct(id)
    if (!existing) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    const data = { ...req.body }
    if (data.price !== undefined) data.price = Number(data.price)
    if (data.preparation_time !== undefined) data.preparation_time = Number(data.preparation_time)
    
    const updated = await productRepo.updateProduct(id, data)
    return res.json(updated)
  } catch (err) {
    console.error('[MenuController] updateProduct:', err)
    return res.status(500).json({ message: 'Failed to update product.' })
  }
}

async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id)
    const existing = await productRepo.getProduct(id)
    if (!existing) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    // Delete recipes first to maintain foreign key constraint
    await recipeRepo.deleteRecipesForProduct(id)
    await productRepo.deleteProduct(id)
    return res.status(204).end()
  } catch (err) {
    console.error('[MenuController] deleteProduct:', err)
    return res.status(500).json({ message: 'Failed to delete product.' })
  }
}

// ── RECIPES ───────────────────────────────────────────────────

async function listRecipesForProduct(req, res) {
  try {
    const productId = Number(req.params.id)
    const recipes = await recipeRepo.getRecipesForProduct(productId)
    return res.json(recipes)
  } catch (err) {
    console.error('[MenuController] listRecipesForProduct:', err)
    return res.status(500).json({ message: 'Failed to fetch recipes.' })
  }
}

async function setRecipe(req, res) {
  try {
    const productId = Number(req.params.id)
    const ingredientId = Number(req.body.ingredient_id ?? req.body.ingredientId)
    const quantity = Number(req.body.quantity ?? req.body.amount ?? 0)

    if (isNaN(ingredientId)) {
      return res.status(400).json({ message: 'Valid ingredient_id is required.' })
    }

    const created = await recipeRepo.setRecipe(productId, ingredientId, { amount: quantity })
    return res.status(200).json(created)
  } catch (err) {
    console.error('[MenuController] setRecipe:', err)
    return res.status(500).json({ message: 'Failed to set recipe.' })
  }
}

async function deleteRecipe(req, res) {
  try {
    const productId = Number(req.params.id)
    const ingredientId = Number(req.params.ingredient_id)
    
    if (isNaN(ingredientId)) {
      return res.status(400).json({ message: 'Valid ingredient_id is required.' })
    }

    await recipeRepo.deleteRecipe(productId, ingredientId)
    return res.status(204).end()
  } catch (err) {
    console.error('[MenuController] deleteRecipe:', err)
    return res.status(500).json({ message: 'Failed to delete recipe.' })
  }
}

module.exports = {
  listProducts,
  getProduct,
  listCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  listRecipesForProduct,
  setRecipe,
  deleteRecipe,
}