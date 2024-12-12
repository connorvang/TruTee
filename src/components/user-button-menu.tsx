'use client'

import { Calendar, Clock, LockIcon } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export function UserButtonMenu() {
  const router = useRouter()

  return (
    <UserButton showName={true}>
      <UserButton.MenuItems>
        <UserButton.Action
          label="Reservations"
          labelIcon={<Clock  size={16}/>}
          onClick={() => {
            router.push('/reservations')
          }}
        />

        <UserButton.Action
          label="Admin"
          labelIcon={<LockIcon  size={16}/>}
          onClick={() => {
            router.push('/admin')
          }}
        />
      </UserButton.MenuItems>
    </UserButton>
  )
} 