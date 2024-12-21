import { Seam } from "seam"
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const seam = new Seam()
    
    // Get access codes for the device
    const accessCodes = await seam.accessCodes.list({
      device_id: params.deviceId
    })
    
    return NextResponse.json(accessCodes)
  } catch (error) {
    console.error('Error fetching access codes:', error)
    return NextResponse.json({ error: 'Failed to fetch access codes' }, { status: 500 })
  }
}