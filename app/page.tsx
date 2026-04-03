'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type Product = {
  id: number
  name: string
  price: number
  category: string
  description: string
  image: string | null
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
    <main className="min-h-screen bg-green-50">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-green-50 border-b border-green-100 px-4 py-4 md:px-8">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-green-800">
              🌽 Agricultural Sells
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Fresh farm products delivered to you
            </p>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="bg-green-600 text-white px-4 py-2 md:px-6 md:py-3 
                       rounded-xl hover:bg-green-700 transition flex items-center gap-2">
            🛒
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="bg-white text-green-600 font-bold 
                               rounded-full w-6 h-6 flex items-center 
                               justify-center text-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">
        <div className="flex gap-8">

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map(product => (
                <div key={product.id}
                     className="bg-white rounded-xl shadow-md overflow-hidden
                                hover:shadow-lg transition">
                  {/* Product Image */}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-green-100 flex items-center 
                                    justify-center text-5xl">
                      🌿
                    </div>
                  )}

                  <div className="p-4 md:p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                        {product.name}
                      </h2>
                      <span className="bg-green-100 text-green-700 text-xs md:text-sm 
                                       px-2 py-1 rounded-full whitespace-nowrap ml-2">
                        {product.category}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl md:text-2xl font-bold text-green-600">
                        KSh {product.price}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-green-600 text-white px-3 py-2 md:px-4 
                                   rounded-lg hover:bg-green-700 transition text-sm md:text-base">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar - desktop only */}
          {showCart && (
            <div className="hidden md:block w-80 bg-white rounded-xl shadow-lg p-6 h-fit sticky top-24">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                🛒 Your Cart
              </h2>
              <CartContent
                cart={cart}
                totalPrice={totalPrice}
                removeFromCart={removeFromCart}
              />
            </div>
          )}

        </div>
      </div>

      {/* Cart Drawer - mobile only */}
      {showCart && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setShowCart(false)}
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-800">🛒 Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light">
                ✕
              </button>
            </div>
            <CartContent
              cart={cart}
              totalPrice={totalPrice}
              removeFromCart={removeFromCart}
            />
          </div>
        </div>
      )}

    </main>
  )
}

function CartContent({
  cart,
  totalPrice,
  removeFromCart,
}: {
  cart: CartItem[]
  totalPrice: number
  removeFromCart: (id: number) => void
}) {
  if (cart.length === 0) {
    return <p className="text-gray-500">Your cart is empty</p>
  }
  return (
    <>
      {cart.map(item => (
        <div key={item.id}
             className="flex justify-between items-center mb-3 pb-3 border-b">
          <div className="flex items-center gap-2">
            {/* Mini image in cart */}
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg">
                🌿
              </div>
            )}
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">
                KSh {item.price} x {item.quantity}
              </p>
            </div>
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
        <button className="w-full bg-green-600 text-white py-3 rounded-xl 
                           hover:bg-green-700 transition font-semibold">
          Checkout →
        </button>
      </div>
    </>
  )
}