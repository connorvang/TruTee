import { Seam } from "seam"
import { NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deviceId = params.deviceId
    const seam = new Seam()
    
    // Use Promise.all to fetch data in parallel
    const [device, accessCodes, events] = await Promise.all([
      seam.devices.get({ device_id: deviceId }),
      seam.accessCodes.list({ device_id: deviceId }),
      seam.events.list({
        device_id: deviceId,
        limit: 20,
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    ])
    
    return NextResponse.json({
      device,
      accessCodes,
      events
    })
  } catch (error) {
    console.error('Error fetching device details:', error)
    return NextResponse.json({ error: 'Failed to fetch device details' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seam = new Seam()
    await seam.devices.delete({
      device_id: params.deviceId
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 })
  }
} 