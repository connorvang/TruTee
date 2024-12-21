import { Seam } from "seam"
import { NextResponse } from 'next/server'
import { auth, currentUser } from "@clerk/nextjs/server"

interface SeamError extends Error {
  code?: string;
  details?: unknown;
}

export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!orgId) {
      return NextResponse.json({ error: 'No organization selected' }, { status: 400 })
    }

    const seam = new Seam()
    

    // Log filtered accounts
    const filteredAccounts = await seam.connectedAccounts.list({
      custom_metadata_has: {
        organization_id: orgId
      }
    })


    // Then get filtered devices
    const allLocks = await seam.devices.list({
      connected_account_ids: filteredAccounts
        .map(account => account.connected_account_id)
        .filter((id): id is string => id !== undefined)
    })
    
    return NextResponse.json(allLocks)
  } catch (error) {
    console.error('Error fetching locks:', error)
    return NextResponse.json({ error: 'Failed to fetch locks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { deviceId, action } = await request.json()
    
    if (deviceId && action) {
      // Handle lock/unlock action
      const seam = new Seam()

      // Check lock state first
      const device = await seam.locks.get({ device_id: deviceId })
      const isLocked = device.properties.locked

      if (action === 'unlock' && !isLocked) {
        return NextResponse.json({ 
          error: 'Door is already unlocked',
          code: 'door_already_unlocked'
        }, { status: 400 })
      }

      if (action === 'lock' && isLocked) {
        return NextResponse.json({ 
          error: 'Door is already locked',
          code: 'door_already_locked'
        }, { status: 400 })
      }

      const actionAttempt = action === 'unlock' 
        ? await seam.locks.unlockDoor({ device_id: deviceId })
        : await seam.locks.lockDoor({ device_id: deviceId })
      
      return NextResponse.json(actionAttempt)
    } else {
      // Handle connect webview creation
      const seam = new Seam()
      const connectWebview = await seam.connectWebviews.create({
        provider_category: "stable",
        wait_for_device_creation: true,
        custom_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/security`,
        custom_redirect_failure_url: `${process.env.NEXT_PUBLIC_BASE_URL}/security?error=true`
      })
      
      return NextResponse.json(connectWebview)
    }
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