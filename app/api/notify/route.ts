import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { order } = await request.json()

  await resend.emails.send({
    from: 'orders@resend.dev',
    to: 'lianlogan11@gmail.com',
    subject: '🌽 New Order Received!',
    html: `
      <h2>New Order from Agricultural Sells! 🌾</h2>
      <p><strong>Customer:</strong> ${order.delivery_info?.name}</p>
      <p><strong>Phone:</strong> ${order.delivery_info?.phone}</p>
      <p><strong>Address:</strong> ${order.delivery_info?.address}, ${order.delivery_info?.town}</p>
      <hr/>
      <h3>Items Ordered:</h3>
      <ul>
        ${order.items.map((item: any) => `<li>${item.name} x${item.quantity} — KSh ${item.price * item.quantity}</li>`).join('')}
      </ul>
      <hr/>
      <h3>Total: KSh ${order.total_price}</h3>
      <p>Payment: ${order.delivery_info?.paymentMethod === 'mpesa' ? '💚 M-Pesa' : '💵 Cash on Delivery'}</p>
    `
  })

  return NextResponse.json({ success: true })
}