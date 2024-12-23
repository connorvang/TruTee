import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { Seam } from "seam"


export async function POST(
  request: NextRequest,
  props: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const body = await request.json()
    const seam = new Seam()
    
    const accessCode = await seam.accessCodes.create({
      device_id: params.deviceId,
      name: body.name,
      code: body.code,
      ...(body.type === 'timebound' && {
        starts_at: body.starts_at,
        ends_at: body.ends_at,
      }),
    })

    return NextResponse.json(accessCode)
  } catch (error) {
    console.error('Error creating access code:', error)
    return NextResponse.json({ error: 'Failed to create access code' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const seam = new Seam()
    
    await seam.accessCodes.delete({
      access_code_id: body.access_code_id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting access code:', error)
    return NextResponse.json({ error: 'Failed to delete access code' }, { status: 500 })
  }
} 