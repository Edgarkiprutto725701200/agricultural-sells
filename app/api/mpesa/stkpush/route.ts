import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { phone, amount } = await request.json()

  const consumerKey = process.env.MPESA_CONSUMER_KEY!
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!
  const shortcode = process.env.MPESA_SHORTCODE!
  const passkey = process.env.MPESA_PASSKEY!
  const callbackUrl = process.env.MPESA_CALLBACK_URL!

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
  const tokenRes = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  )
  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

  const stkRes = await fetch(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: 'AgriculturalSells',
        TransactionDesc: 'Payment for farm products',
      }),
    }
  )

  const stkData = await stkRes.json()
  return NextResponse.json(stkData)
}