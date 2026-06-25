import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as api from '@/data_access/api'

export default function EditRecipe() {
  const { productId: pidParam } = useParams()
  const productId = pidParam ? (isNaN(Number(pidParam)) ? pidParam : Number(pidParam)) : null
  const navigate = useNavigate()
  const location = useLocation()

  const [product, setProduct] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [entries, setEntries] = useState([])
  const [originalEntries, setOriginalEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!productId) return
      try {
        setLoading(true)

        const [p, ing, rec] = await Promise.all([
          api.getProduct(productId),
          api.getIngredients(),
          api.getRecipesForProduct(productId),
        ])

        setProduct(p)
        setIngredients(ing || [])

        const mapped = (rec || []).map(r => ({ ingredientId: r.ingredient_id, productId: r.product_id, quantity: r.amount ?? 1 }))
        setEntries(mapped)
        setOriginalEntries(mapped)
      } catch (err) {
        console.error('Error loading recipe data', err)
        alert('Failed to load recipe data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId])

  const handleAdd = () => {
    setEntries(prev => [...prev, { ingredientId: '', quantity: 1 }])
  }

  const handleRemove = (index) => {
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  const handleChange = (index, field, value) => {
    const val = field === 'quantity' ? Number(value) : String(value)
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: val } : e))
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      const currentMap = new Map(entries.filter(e => e.ingredientId).map(e => [String(e.ingredientId), e.quantity]))
      const originalMap = new Map(originalEntries.map(e => [String(e.ingredientId), e.quantity]))

      // Upsert current entries
      for (const [ingId, qty] of currentMap.entries()) {
        const ingKey = isNaN(Number(ingId)) ? ingId : Number(ingId)
        await api.setRecipe(productId, ingKey, { quantity: Number(qty) })
      }

      // Delete removed entries
      for (const [origId] of originalMap.entries()) {
        if (!currentMap.has(origId)) {
          const ingKey = isNaN(Number(origId)) ? origId : Number(origId)
          await api.deleteRecipe(productId, ingKey)
        }
      }

      alert('Recipe saved')
      navigate('/menu')
    } catch (err) {
      console.error('Error saving recipe', err)
      alert('Failed to save recipe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-8 overflow-auto bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Recipe</h1>
            <p className="text-gray-600">{product ? product.name : `Product ${productId}`}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/menu')} variant="outline">Back</Button>
            <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">Save</Button>
          </div>
        </div>

        <Card className="p-6 bg-white border border-gray-200">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div>
              <div className="space-y-3">
                {entries.length === 0 && (
                  <p className="text-sm text-gray-500">No ingredients added. Click "Add Ingredient" to begin.</p>
                )}

                {entries.map((entry, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Label className="text-sm">Ingredient</Label>
                      <select
                        value={entry.ingredientId}
                        onChange={(e) => handleChange(idx, 'ingredientId', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">-- Select ingredient --</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name || ing.name_en || ing.id}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <Label className="text-sm">Quantity</Label>
                      <Input
                        type="number"
                        min={0}
                        value={entry.quantity}
                        onChange={(e) => handleChange(idx, 'quantity', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2 flex items-end">
                      <Button variant="outline" onClick={() => handleRemove(idx)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Button onClick={handleAdd} variant="ghost">Add Ingredient</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
