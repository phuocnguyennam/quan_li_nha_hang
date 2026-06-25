import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2, Plus, Search, Filter, Edit, Eye, EyeOff } from 'lucide-react'
import * as api from '@/data_access/api'
import { useNavigate } from 'react-router-dom'

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const itemRefs = useRef({})
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: '',
    available: true,
    image: ''
  })

  // Load menu items and categories from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Load products (menu items)
        const products = await api.getProducts()
        setMenuItems(products)

        // Load categories
        const cats = await api.getCategories()
        setCategories(['All', ...cats.map(c => c.name || c)])
        
        setError(null)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load menu data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      alert('Please fill in required fields: name, price, category')
      return
    }

    try {
      const data = {
        name: newItem.name,
        description: newItem.description || '',
        price: parseFloat(newItem.price),
        category: newItem.category,
        preparationTime: parseInt(newItem.preparationTime) || 0,
        available: newItem.available,
        image: newItem.image || ''
      }

      if (editingId) {
        // Update existing
        const updated = await api.updateProduct(editingId, data)
        setMenuItems(menuItems.map(item => item.id === editingId ? updated : item))
        setIsEditDialogOpen(false)
        setEditingId(null)
        
        // Scroll to updated item
        setTimeout(() => {
          itemRefs.current[editingId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      } else {
        // Add new
        const created = await api.addProduct(data)
        setMenuItems([...menuItems, created])
      }

      setNewItem({
        name: '',
        description: '',
        price: '',
        category: '',
        preparationTime: '',
        available: true
      })
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      console.error('Error saving product:', err)
      alert('Failed to save product')
    }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      await api.deleteProduct(id)
      setMenuItems(menuItems.filter(item => item.id !== id))
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Failed to delete product')
    }
  }

  const handleEditItem = (item) => {
    setNewItem({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime || 0,
      available: item.available,
      image: item.image || ''
    })
    setEditingId(item.id)
    setIsEditDialogOpen(true)
  }

  const navigate = useNavigate()

  const handleEditRecipe = async () => {
    try {
      const productId = editingId
      if (!productId) return

      // Fetch recipe entries and available ingredients
      const recipes = await api.getRecipesForProduct(productId)
      const ingredients = await api.getIngredients()

      // Navigate to edit recipe page, pass fetched data via location state
      navigate(`/menu/${productId}/recipe`, { state: { productId, recipes, ingredients, product: menuItems.find(i => i.id === productId) } })
    } catch (err) {
      console.error('Error fetching recipe data:', err)
      alert('Failed to load recipe data')
    }
  }

  const toggleAvailability = async (id) => {
    try {
      const item = menuItems.find(i => i.id === id)
      if (!item) return
      
      const updated = await api.updateProduct(id, {
        available: !item.available
      })
      setMenuItems(menuItems.map(i => i.id === id ? { ...i, available: updated.available } : i))
    } catch (err) {
      console.error('Error updating availability:', err)
      alert('Failed to update availability')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setIsEditDialogOpen(false)
    setNewItem({
      name: '',
      description: '',
      price: '',
      category: '',
      preparationTime: '',
      available: true,
      image: ''
    })
    setEditingId(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="flex-1 p-8 overflow-auto bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
            <p className="text-gray-600 mt-1">Manage your restaurant menu items</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600 gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Add Item'}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <Card className="p-8 text-center bg-white border border-gray-300">
            <p className="text-gray-600 text-lg">Loading menu items...</p>
          </Card>
        ) : (
          <>
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-blue-500 hover:bg-blue-600" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
              <Card className="p-6 mb-8 border border-gray-300 bg-white">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Item Name</Label>
                    <Input
                      placeholder="e.g., Black Coffee"
                      name="name"
                      value={newItem.name}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <select
                      name="category"
                      value={newItem.category}
                      onChange={handleInputChange}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {categories.filter(cat => cat !== 'All').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Price ($)</Label>
                    <Input
                      placeholder="e.g., 25000"
                      type="number"
                      name="price"
                      value={newItem.price}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Preparation Time (minutes)</Label>
                    <Input
                      placeholder="e.g., 5"
                      type="number"
                      name="preparationTime"
                      value={newItem.preparationTime}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <Input
                      placeholder="Brief description of the item"
                      name="description"
                      value={newItem.description}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Image URL</Label>
                    <Input
                      placeholder="e.g., https://example.com/image.jpg"
                      name="image"
                      value={newItem.image}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAddItem}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    {editingId ? 'Update Item' : 'Save Item'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Menu Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Item Name</Label>
                    <Input
                      placeholder="e.g., Black Coffee"
                      name="name"
                      value={newItem.name}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <select
                      name="category"
                      value={newItem.category}
                      onChange={handleInputChange}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {categories.filter(cat => cat !== 'All').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Price ($)</Label>
                    <Input
                      placeholder="e.g., 25000"
                      type="number"
                      name="price"
                      value={newItem.price}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Preparation Time (minutes)</Label>
                    <Input
                      placeholder="e.g., 5"
                      type="number"
                      name="preparationTime"
                      value={newItem.preparationTime}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <Input
                      placeholder="Brief description of the item"
                      name="description"
                      value={newItem.description}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Image URL</Label>
                    <Input
                      placeholder="e.g., https://example.com/image.jpg"
                      name="image"
                      value={newItem.image}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleEditRecipe}
                    variant="outline"
                    className="flex-1"
                  >
                    Edit Recipe
                  </Button>
                  <Button
                    onClick={handleAddItem}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    Update Item
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.length === 0 ? (
                <div className="col-span-full">
                  <Card className="p-8 text-center bg-white border border-gray-300">
                    <p className="text-gray-500 text-lg">No menu items found. Add your first item!</p>
                  </Card>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <Card 
                    key={item.id} 
                    ref={el => itemRefs.current[item.id] = el}
                    className="p-0 border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                  >
                    {/* Image Section */}
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.classList.add('flex', 'items-center', 'justify-center')
                            if (!e.target.parentElement.querySelector('.fallback')) {
                              const fallback = document.createElement('span')
                              fallback.className = 'text-gray-500 text-sm fallback'
                              fallback.textContent = '🍽️ No Image'
                              e.target.parentElement.appendChild(fallback)
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-500 text-3xl">🍽️</span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5">
                      {/* Status Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 whitespace-nowrap ${
                          item.available 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.available ? '✓ Available' : '✗ Unavailable'}
                        </span>
                      </div>

                      {/* Category and Description */}
                      <div className="mb-4">
                        <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
                          {item.category}
                        </span>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Price and Prep Time */}
                      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Price</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">${item.price}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Prep Time</p>
                          <p className="text-2xl font-bold text-gray-700 mt-1">{item.preparationTime} min</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          className={`px-3.5 py-2.5 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 text-sm ${
                            item.available
                              ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                          title={item.available ? 'Hide item' : 'Show item'}
                        >
                          {item.available ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Show
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2.5 px-3.5 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-blue-50 border border-blue-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{menuItems.length}</div>
                  <div className="text-sm text-blue-600">Total Items</div>
                </div>
              </Card>
              <Card className="p-4 bg-green-50 border border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {menuItems.filter(item => item.available).length}
                  </div>
                  <div className="text-sm text-green-600">Available</div>
                </div>
              </Card>
              <Card className="p-4 bg-orange-50 border border-orange-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-700">
                    {categories.filter(cat => cat !== 'All').length}
                  </div>
                  <div className="text-sm text-orange-600">Categories</div>
                </div>
              </Card>
              <Card className="p-4 bg-purple-50 border border-purple-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {Math.round(menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length) || 0}
                  </div>
                  <div className="text-sm text-purple-600">Avg Price</div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
