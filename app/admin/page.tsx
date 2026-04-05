'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

type Product = {
  id: number
  name: string
  price: number
  category: string
  description: string
  image: string | null
}

type Order = {
  id: string
  created_at: string
  total_price: number
  status: string
  items: { name: string; quantity: number; price: number }[]
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: '', description: '', image: ''
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [message, setMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [wrongPassword, setWrongPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts()
      loadOrders()
    }
  }, [isAuthenticated])

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*')
    setProducts(data || [])
  }

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }

  function handleLogin() {
   if (password === 'Edgar456321') {
      setIsAuthenticated(true)
      setWrongPassword(false)
    } else {
      setWrongPassword(true)
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    setMessage('Product deleted!')
    loadProducts()
    setTimeout(() => setMessage(''), 3000)
  }

  async function saveEditProduct() {
    if (!editingProduct) return
    await supabase.from('products').update({
      name: editingProduct.name,
      price: editingProduct.price,
      category: editingProduct.category,
      description: editingProduct.description,
      image: editingProduct.image,
    }).eq('id', editingProduct.id)
    setEditingProduct(null)
    setMessage('Product updated!')
    loadProducts()
    setTimeout(() => setMessage(''), 3000)
  }

  async function addProduct() {
    if (!newProduct.name || !newProduct.price) return
    await supabase.from('products').insert({
      name: newProduct.name,
      price: Number(newProduct.price),
      category: newProduct.category,
      description: newProduct.description,
      image: newProduct.image || null,
    })
    setNewProduct({ name: '', price: '', category: '', description: '', image: '' })
    setShowAddForm(false)
    setMessage('Product added!')
    loadProducts()
    setTimeout(() => setMessage(''), 3000)
  }

  async function updateOrderStatus(id: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setMessage('Order status updated!')
    loadOrders()
    setTimeout(() => setMessage(''), 3000)
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
          <h1 className="text-2xl font-bold text-green-800 mb-2">🌾 Admin Access</h1>
          <p className="text-gray-500 text-sm mb-6">Enter the admin password to continue</p>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 
                       mb-4 focus:border-green-500 focus:outline-none"/>
          {wrongPassword && (
            <p className="text-red-500 text-sm mb-4">❌ Wrong password. Try again.</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-green-600 text-white py-3 rounded-xl 
                       hover:bg-green-700 transition font-semibold">
            Login →
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-green-700 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🌾 Admin Dashboard</h1>
            <p className="text-green-200 text-sm">Agricultural Sells Management</p>
          </div>
          <a href="/" className="bg-white text-green-700 px-4 py-2 rounded-lg 
                                  font-medium hover:bg-green-50 transition text-sm">
            ← Back to Store
          </a>
        </div>
      </div>

      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 
                        bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg">
          ✅ {message}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'products' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}>
            🛍️ Products ({products.length})
          </button>
          <button onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'orders' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}>
            📋 Orders ({orders.length})
          </button>
        </div>

        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Products</h2>
              <button onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                + Add Product
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h3 className="font-bold text-gray-800 mb-4">New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Name" value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="border rounded-lg px-3 py-2 text-sm"/>
                  <input placeholder="Price (KSh)" value={newProduct.price} type="number"
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    className="border rounded-lg px-3 py-2 text-sm"/>
                  <input placeholder="Category" value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    className="border rounded-lg px-3 py-2 text-sm"/>
                  <input placeholder="Image URL" value={newProduct.image}
                    onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                    className="border rounded-lg px-3 py-2 text-sm"/>
                  <input placeholder="Description" value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    className="border rounded-lg px-3 py-2 text-sm md:col-span-2"/>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addProduct}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    Save Product
                  </button>
                  <button onClick={() => setShowAddForm(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Product</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Price</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"/>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">🌿</div>
                          )}
                          <span className="font-medium text-gray-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                      <td className="px-4 py-3 font-medium text-green-600">KSh {product.price}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingProduct(product)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                          <button onClick={() => deleteProduct(product.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editingProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black bg-opacity-40"
                  onClick={() => setEditingProduct(null)}/>
                <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                  <h3 className="font-bold text-gray-800 mb-4">Edit Product</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <input placeholder="Name" value={editingProduct.name}
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="border rounded-lg px-3 py-2 text-sm"/>
                    <input placeholder="Price" value={editingProduct.price} type="number"
                      onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      className="border rounded-lg px-3 py-2 text-sm"/>
                    <input placeholder="Category" value={editingProduct.category}
                      onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="border rounded-lg px-3 py-2 text-sm"/>
                    <input placeholder="Image URL" value={editingProduct.image || ''}
                      onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}
                      className="border rounded-lg px-3 py-2 text-sm"/>
                    <input placeholder="Description" value={editingProduct.description}
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="border rounded-lg px-3 py-2 text-sm"/>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveEditProduct}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                      Save Changes
                    </button>
                    <button onClick={() => setEditingProduct(null)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Orders</h2>
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-xl shadow p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-800">
                        {new Date(order.created_at).toLocaleDateString('en-KE', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('en-KE', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <select value={order.status}
                      onChange={e => updateOrderStatus(order.id, e.target.value)}
                      className={`text-xs px-3 py-1 rounded-full font-medium border-0 cursor-pointer
                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : ''}
                        ${order.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}`}>
                      <option value="pending">pending</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {order.items.map((item, i) => (
                      <span key={i}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                  <p className="font-bold text-green-600">KSh {order.total_price}</p>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-gray-500 text-center py-8">No orders yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}