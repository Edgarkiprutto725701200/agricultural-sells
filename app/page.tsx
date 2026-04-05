'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

type Order = {
  id: string
  created_at: string
  total_price: number
  status: string
  items: CartItem[]
}

type DeliveryInfo = {
  name: string
  phone: string
  address: string
  town: string
}

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [showDelivery, setShowDelivery] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    name: '', phone: '', address: '', town: ''
  })
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cod'>('cod')
  const [mpesaLoading, setMpesaLoading] = useState(false)
  const [mpesaMessage, setMpesaMessage] = useState('')

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase.from('products').select('*')
      setProducts(data || [])
    }
    loadProducts()
  }, [])

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }

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

  async function placeOrder() {
    if (cart.length === 0) return
    if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) return

    const { error } = await supabase.from('orders').insert({
      total_price: totalPrice,
      status: 'pending',
      items: cart,
      delivery_info: deliveryInfo,
    })
    if (!error) {
      setCart([])
      setShowCart(false)
      setShowDelivery(false)
      setDeliveryInfo({ name: '', phone: '', address: '', town: '' })
      setOrderPlaced(true)
      setTimeout(() => setOrderPlaced(false), 3000)
    }
  }

  async function handleMpesaPayment() {
    if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) return
    setMpesaLoading(true)
    setMpesaMessage('')

    let formattedPhone = deliveryInfo.phone.trim()
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    }
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1)
    }

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, amount: totalPrice }),
      })
      const data = await res.json()

      if (data.ResponseCode === '0') {
        await supabase.from('orders').insert({
          total_price: totalPrice,
          status: 'pending',
          items: cart,
          delivery_info: deliveryInfo,
        })
        setMpesaMessage('✅ STK Push sent! Check your phone to complete payment.')
        setTimeout(() => {
          setCart([])
          setShowCart(false)
          setShowDelivery(false)
          setDeliveryInfo({ name: '', phone: '', address: '', town: '' })
          setMpesaMessage('')
          setOrderPlaced(true)
          setTimeout(() => setOrderPlaced(false), 3000)
        }, 3000)
      } else {
        setMpesaMessage('❌ ' + (data.errorMessage || 'Payment failed. Try again.'))
      }
    } catch {
      setMpesaMessage('❌ Network error. Please try again.')
    }
    setMpesaLoading(false)
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <main className="min-h-screen bg-green-50">

      {/* Toast */}
      {orderPlaced && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 
                        bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg">
          ✅ Order placed! We will deliver to you soon 🚚
        </div>
      )}

      {/* Delivery + Payment Modal */}
      {showDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowDelivery(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-green-800 mb-1">🚚 Delivery Details</h2>
            <p className="text-gray-500 text-sm mb-4">Tell us where to deliver your order</p>

            {/* Order Summary */}
            <div className="bg-green-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-gray-600">Order Total</p>
              <p className="text-2xl font-bold text-green-600">KSh {totalPrice}</p>
            </div>

            {/* Delivery Form */}
            <div className="space-y-3 mb-4">
              <input
                placeholder="Full Name *"
                value={deliveryInfo.name}
                onChange={e => setDeliveryInfo({...deliveryInfo, name: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                           text-gray-900 placeholder-gray-400
                           focus:border-green-500 focus:outline-none text-sm"/>
              <input
                placeholder="Phone Number * (07XXXXXXXX)"
                value={deliveryInfo.phone}
                onChange={e => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                           text-gray-900 placeholder-gray-400
                           focus:border-green-500 focus:outline-none text-sm"/>
              <input
                placeholder="Delivery Address * (e.g. Kenyatta Ave, House No. 5)"
                value={deliveryInfo.address}
                onChange={e => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                           text-gray-900 placeholder-gray-400
                           focus:border-green-500 focus:outline-none text-sm"/>
              <input
                placeholder="Town/Area (e.g. Nairobi, Eldoret)"
                value={deliveryInfo.town}
                onChange={e => setDeliveryInfo({...deliveryInfo, town: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                           text-gray-900 placeholder-gray-400
                           focus:border-green-500 focus:outline-none text-sm"/>
            </div>

            {/* Payment Method */}
            <p className="font-medium text-gray-700 mb-2">Payment Method</p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod('mpesa')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition ${
                  paymentMethod === 'mpesa'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600'
                }`}>
                💚 M-Pesa
              </button>
              <button
                onClick={() => setPaymentMethod('cod')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition ${
                  paymentMethod === 'cod'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600'
                }`}>
                💵 Cash on Delivery
              </button>
            </div>

            {/* M-Pesa message */}
            {mpesaMessage && (
              <p className={`text-sm mb-4 p-3 rounded-lg ${
                mpesaMessage.startsWith('✅')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {mpesaMessage}
              </p>
            )}

            {/* Submit Button */}
            <button
              onClick={paymentMethod === 'mpesa' ? handleMpesaPayment : placeOrder}
              disabled={mpesaLoading || !deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address}
              className="w-full bg-green-600 text-white py-3 rounded-xl
                         hover:bg-green-700 transition font-semibold disabled:opacity-50
                         disabled:cursor-not-allowed mb-2">
              {mpesaLoading ? '⏳ Sending...' : paymentMethod === 'mpesa' ? '💚 Pay with M-Pesa' : '🚚 Place Order'}
            </button>
            <button
              onClick={() => setShowDelivery(false)}
              className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl
                         hover:bg-gray-200 transition font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-green-50 border-b border-green-100 px-4 py-3 md:px-8">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-4xl font-bold text-green-800">
              🌽 Agricultural Sells
            </h1>
            <p className="text-gray-600 text-xs md:text-base">
              Fresh farm products delivered to you
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowOrders(!showOrders); setShowCart(false); loadOrders() }}
              className="bg-white border border-green-600 text-green-600 px-2 py-1
                         md:px-4 md:py-3 rounded-xl hover:bg-green-50 transition
                         text-xs md:text-base">
              📋 Orders
            </button>
            <button
              onClick={() => { setShowCart(!showCart); setShowOrders(false) }}
              className="bg-green-600 text-white px-3 py-1 md:px-6 md:py-3
                         rounded-xl hover:bg-green-700 transition flex items-center gap-1">
              🛒
              <span className="hidden sm:inline text-sm">Cart</span>
              {totalItems > 0 && (
                <span className="bg-white text-green-600 font-bold
                                 rounded-full w-5 h-5 flex items-center
                                 justify-center text-xs">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 py-4 md:px-8">
        <div className="flex gap-6">

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {products.map(product => (
                <div key={product.id}
                     onClick={() => router.push(`/product/${product.id}`)}
                     className="bg-white rounded-xl shadow-md overflow-hidden
                                hover:shadow-lg transition cursor-pointer">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 md:h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 md:h-48 bg-green-100 flex items-center
                                    justify-center text-4xl">
                      🌿
                    </div>
                  )}
                  <div className="p-2 md:p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h2 className="text-sm md:text-xl font-semibold text-gray-800 leading-tight">
                        {product.name}
                      </h2>
                      <span className="bg-green-100 text-green-700 text-xs
                                       px-1 py-0.5 rounded-full whitespace-nowrap ml-1 hidden sm:block">
                        {product.category}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mb-2 hidden sm:block">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-2xl font-bold text-green-600">
                        KSh {product.price}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); addToCart(product) }}
                        className="bg-green-600 text-white px-2 py-1 md:px-4 md:py-2
                                   rounded-lg hover:bg-green-700 transition text-xs md:text-base">
                        Add
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
              <h2 className="text-xl font-bold text-green-800 mb-4">🛒 Your Cart</h2>
              <CartContent
                cart={cart}
                totalPrice={totalPrice}
                removeFromCart={removeFromCart}
                onCheckout={() => { setShowCart(false); setShowDelivery(true) }}
              />
            </div>
          )}

          {/* Orders Sidebar - desktop only */}
          {showOrders && (
            <div className="hidden md:block w-80 bg-white rounded-xl shadow-lg p-6 h-fit sticky top-24 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-green-800 mb-4">📋 Order History</h2>
              <OrdersList orders={orders} />
            </div>
          )}
        </div>
      </div>

      {/* Cart Drawer - mobile only */}
      {showCart && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-800">🛒 Your Cart</h2>
              <button onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light">✕</button>
            </div>
            <CartContent
              cart={cart}
              totalPrice={totalPrice}
              removeFromCart={removeFromCart}
              onCheckout={() => { setShowCart(false); setShowDelivery(true) }}
            />
          </div>
        </div>
      )}

      {/* Orders Drawer - mobile only */}
      {showOrders && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setShowOrders(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-800">📋 Order History</h2>
              <button onClick={() => setShowOrders(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light">✕</button>
            </div>
            <OrdersList orders={orders} />
          </div>
        </div>
      )}
    </main>
  )
}

function CartContent({
  cart, totalPrice, removeFromCart, onCheckout
}: {
  cart: CartItem[]
  totalPrice: number
  removeFromCart: (id: number) => void
  onCheckout: () => void
}) {
  if (cart.length === 0) {
    return <p className="text-gray-500">Your cart is empty</p>
  }
  return (
    <>
      {cart.map(item => (
        <div key={item.id} className="flex justify-between items-center mb-3 pb-3 border-b">
          <div className="flex items-center gap-2">
            {item.image ? (
              <img src={item.image} alt={item.name}
                className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg">
                🌿
              </div>
            )}
            <div>
              <p className="font-medium text-sm text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">KSh {item.price} x {item.quantity}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-green-600 text-sm">KSh {item.price * item.quantity}</span>
            <button onClick={() => removeFromCart(item.id)}
              className="text-red-400 hover:text-red-600 text-sm">✕</button>
          </div>
        </div>
      ))}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between font-bold text-lg mb-4">
          <span>Total:</span>
          <span className="text-green-600">KSh {totalPrice}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full bg-green-600 text-white py-3 rounded-xl
                     hover:bg-green-700 transition font-semibold">
          🚚 Proceed to Checkout
        </button>
      </div>
    </>
  )
}

function OrdersList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="text-gray-500">No orders yet</p>
  }
  return (
    <>
      {orders.map(order => (
        <div key={order.id} className="mb-4 pb-4 border-b">
          <div className="flex justify-between items-start mb-2">
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
            <span className={`text-xs px-2 py-1 rounded-full font-medium
              ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : ''}
              ${order.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}`}>
              {order.status}
            </span>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            {order.items.map((item, i) => (
              <span key={i}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
            ))}
          </div>
          <p className="font-bold text-green-600">KSh {order.total_price}</p>
        </div>
      ))}
    </>
  )
}