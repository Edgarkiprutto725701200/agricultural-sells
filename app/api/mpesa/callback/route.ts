import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const data = await request.json()
  console.log('M-Pesa callback:', JSON.stringify(data))
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
}