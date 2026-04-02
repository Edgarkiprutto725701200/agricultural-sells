'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type Product = {
  id: number
  name: string
  price: number
  category: string
  description: string
}

type CartItem = Product & { quantity: number }

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase.from('products').select('*')
      setProducts(data || [])
    }
    loadProducts()
  }, [])

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  function removeFromCart(id: number) {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-green-800">
              🌽 Agricultural Sells
            </h1>
            <p className="text-gray-600">Fresh farm products delivered to you</p>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="bg-green-600 text-white px-6 py-3 rounded-xl 
                       hover:bg-green-700 transition flex items-center gap-2">
            🛒 Cart
            {totalItems > 0 && (
              <span className="bg-white text-green-600 font-bold 
                               rounded-full w-6 h-6 flex items-center 
                               justify-center text-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-8">

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id}
                     className="bg-white rounded-xl shadow-md p-6 
                                hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {product.name}
                    </h2>
                    <span className="bg-green-100 text-green-700 text-sm 
                                     px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">
                      KSh {product.price}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-green-600 text-white px-4 py-2 
                                 rounded-lg hover:bg-green-700 transition">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          {showCart && (
            <div className="w-80 bg-white rounded-xl shadow-lg p-6 h-fit sticky top-8">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                🛒 Your Cart
              </h2>
              {cart.length === 0 ? (
                <p className="text-gray-500">Your cart is empty</p>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} 
                         className="flex justify-between items-center 
                                    mb-3 pb-3 border-b">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          KSh {item.price} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">
                          KSh {item.price * item.quantity}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-600 text-sm">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between font-bold text-lg mb-4">
                      <span>Total:</span>
                      <span className="text-green-600">KSh {totalPrice}</span>
                    </div>
                    <button className="w-full bg-green-600 text-white py-3 
                                       rounded-xl hover:bg-green-700 transition 
                                       font-semibold">
                      Checkout →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  )
}