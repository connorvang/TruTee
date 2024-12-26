'use server'

import { Seam } from "seam"
import { auth } from "@clerk/nextjs/server"

export async function getDevices() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }
    if (!orgId) {
      throw new Error('No organization selected')
    }

    const seam = new Seam()
    
    // Get filtered accounts for org
    const filteredAccounts = await seam.connectedAccounts.list({
      custom_metadata_has: {
        organization_id: orgId
      }
    })

    // Then get filtered devices
    const devices = await seam.devices.list({
      connected_account_ids: filteredAccounts
        .map(account => account.connected_account_id)
        .filter((id): id is string => id !== undefined)
    })

    return devices
  } catch (error) {
    console.error('Error fetching devices:', error)
    throw new Error('Failed to fetch devices')
  }
} 