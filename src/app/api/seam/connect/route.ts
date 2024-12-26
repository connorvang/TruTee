import { Seam } from "seam"
import { NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"

interface SeamError extends Error {
  code?: string;
  details?: unknown;
}

export async function POST() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!orgId) {
      return NextResponse.json({ error: 'No organization selected' }, { status: 400 })
    }

    const seam = new Seam()
    const connectWebview = await seam.connectWebviews.create({
      provider_category: "stable",
      wait_for_device_creation: true,
      custom_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/security`,
      custom_redirect_failure_url: `${process.env.NEXT_PUBLIC_BASE_URL}/security?error=true`,
      custom_metadata: {
        organization_id: orgId,
        user_identifier: userId
      }
    })
    
    return NextResponse.json(connectWebview)
  } catch (error: unknown) {
    const seamError = error as SeamError
    console.error('Seam API error:', seamError)
    return NextResponse.json({
      error: seamError.message,
      code: seamError.code,
      details: seamError.details
    }, { status: 500 })
  }
}