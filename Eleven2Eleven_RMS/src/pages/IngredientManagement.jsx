import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2, Plus, Search, Edit } from 'lucide-react'
import * as api from '@/data_access/api'

export default function IngredientManagement() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load ingredients from Firebase
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        setLoading(true)
        const data = await api.getIngredients()
        setIngredients(data)
        setError(null)
      } catch (err) {
        console.error('Error loading ingredients:', err)
        setError('Failed to load ingredients')
      } finally {
        setLoading(false)
      }
    }

    loadIngredients()
  }, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const rowRefs = useRef({})
  const [newItem, setNewItem] = useState({
    name: '',
    unit: '',
    quantity: ''
  })

  // Filter ingredients based on search
  const filteredIngredients = useMemo(() => {
    const term = (searchTerm || '').toLowerCase()
    return ingredients.filter(item => {
      const name = item && item.name ? String(item.name).toLowerCase() : ''
      return name.includes(term)
    })
  }, [ingredients, searchTerm])

  const handleAddClick = () => {
    setEditingId(null)
    setNewItem({
      name: '',
      unit: '',
      quantity: ''
    })
    setShowForm(true)
  }

  const handleEditClick = (item) => {
    setEditingId(item.id)
    setNewItem(item)
    setIsEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!newItem.name || !newItem.unit) {
      alert('Please fill in ingredient name and unit')
      return
    }

    try {
      if (editingId) {
        // Update existing ingredient
        const updated = await api.updateIngredient(editingId, {
          name: newItem.name,
          unit: newItem.unit,
          quantity: parseFloat(newItem.quantity) || 0
        })
        setIngredients(ingredients.map(item =>
          item.id === editingId ? updated : item
        ))
        setIsEditDialogOpen(false)
        setEditingId(null)
        
        // Scroll to updated item
        setTimeout(() => {
          rowRefs.current[editingId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      } else {
        // Add new ingredient
        const created = await api.addIngredient({
          name: newItem.name,
          unit: newItem.unit,
          quantity: parseFloat(newItem.quantity) || 0
        })
        setIngredients([...ingredients, created])
      }

      setShowForm(false)
      setNewItem({
        name: '',
        unit: '',
        quantity: ''
      })
      setIsEditDialogOpen(false)
    } catch (err) {
      console.error('Error saving ingredient:', err)
      alert('Failed to save ingredient')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await api.deleteIngredient(id)
        setIngredients(ingredients.filter(item => item.id !== id))
      } catch (err) {
        console.error('Error deleting ingredient:', err)
        alert('Failed to delete ingredient')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewItem(prev => ({
      ...prev,
      [name]: name === 'quantity' ? value : value
    }))
  }

  return (
    <div className="flex-1 p-6 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ingredient Management</h1>
          <p className="text-gray-600">Manage restaurant ingredients and inventory</p>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">Loading ingredients...</p>
          </Card>
        ) : (
          <>
            {/* Action Bar */}
            <div className="mb-6 flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search ingredients by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-11 bg-white border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleAddClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Add Ingredient
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <Card className="mb-6 p-6 border border-gray-200 bg-white shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {editingId ? 'Edit Ingredient' : 'Add New Ingredient'}
                </h2>
                <Separator className="mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Ingredient Name *</Label>
                    <Input
                      name="name"
                      value={newItem.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Chicken"
                      className="h-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Unit *</Label>
                    <Input
                      name="unit"
                      value={newItem.unit}
                      onChange={handleInputChange}
                      placeholder="e.g., gram, ml, piece"
                      className="h-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Quantity</Label>
                    <Input
                      type="number"
                      name="quantity"
                      value={newItem.quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="0.01"
                      className="h-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    {editingId ? 'Update' : 'Add'}
                  </button>
                </div>
              </Card>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Ingredient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Ingredient Name *</Label>
                    <Input
                      name="name"
                      value={newItem.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Chicken"
                      className="h-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Unit *</Label>
                    <Input
                      name="unit"
                      value={newItem.unit}
                      onChange={handleInputChange}
                      placeholder="e.g., kg, gram, liter"
                      className="h-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Quantity</Label>
                    <Input
                      type="number"
                      name="quantity"
                      value={newItem.quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="0.01"
                      className="h-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    Update
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Ingredients Table */}
            <Card className="mb-6 border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '40%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Unit</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Quantity</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <p className="text-gray-500 text-sm">No ingredients found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((item, idx) => (
                      <tr 
                        key={item.id} 
                        ref={el => rowRefs.current[item.id] = el}
                        className={`border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-block px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-colors duration-200 text-sm"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors duration-200 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-blue-50 border border-blue-200 shadow-sm">
                <div className="text-center">
                  <p className="text-blue-600 text-xs uppercase tracking-wider font-semibold mb-1">Total Ingredients</p>
                  <p className="text-3xl font-bold text-blue-900">{ingredients.length}</p>
                </div>
              </Card>
              <Card className="p-4 bg-green-50 border border-green-200 shadow-sm">
                <div className="text-center">
                  <p className="text-green-600 text-xs uppercase tracking-wider font-semibold mb-1">Displayed</p>
                  <p className="text-3xl font-bold text-green-900">{filteredIngredients.length}</p>
                </div>
              </Card>
              <Card className="p-4 bg-purple-50 border border-purple-200 shadow-sm">
                <div className="text-center">
                  <p className="text-purple-600 text-xs uppercase tracking-wider font-semibold mb-1">Low Stock</p>
                  <p className="text-3xl font-bold text-purple-900">{ingredients.filter(i => i.quantity < 10).length}</p>
                </div>
              </Card>
              <Card className="p-4 bg-orange-50 border border-orange-200 shadow-sm">
                <div className="text-center">
                  <p className="text-orange-600 text-xs uppercase tracking-wider font-semibold mb-1">Total Units</p>
                  <p className="text-3xl font-bold text-orange-900">{new Set(ingredients.map(i => i.unit)).size}</p>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
