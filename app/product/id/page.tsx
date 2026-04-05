'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../supabase'

type Product = {
  id: number
  name: string
  price: number
  category: string
  description: string
  image: string | null
}

export default function ProductPage() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      setProduct(data)
    }
    if (id) loadProduct()
  }, [id])

  function addToCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find((item: Product & { quantity: number }) => item.id === product?.id)
    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({ ...product, quantity: 1 })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-green-50 border-b border-green-100 px-4 py-3">
        <button
          onClick={() => router.back()}
          className="text-green-700 font-medium flex items-center gap-2">
          ← Back
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Product Image */}
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-72 object-cover rounded-2xl shadow-md mb-6"
          />
        ) : (
          <div className="w-full h-72 bg-green-100 rounded-2xl flex items-center 
                          justify-center text-7xl mb-6">
            🌿
          </div>
        )}

        {/* Product Info */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
            <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
              {product.category}
            </span>
          </div>

          <p className="text-gray-500 mb-6">{product.description}</p>

          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold text-green-600">
              KSh {product.price}
            </span>
            <button
              onClick={addToCart}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                added
                  ? 'bg-green-100 text-green-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}>
              {added ? '✅ Added!' : '🛒 Add to Cart'}
            </button>
          </div>
        </div>

        {/* Back to store */}
        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 bg-white text-green-700 border border-green-300 
                     py-3 rounded-xl font-medium hover:bg-green-50 transition">
          ← Continue Shopping
        </button>
      </div>
    </main>
  )
}