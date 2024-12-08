import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { ClerkProvider } from '@clerk/nextjs' 
import Link from 'next/link'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export const metadata = {
  title: "TruTee",
  description: "Create and manage tee times for your golf course",
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <div className="min-h-screen">
          {children}
        </div>
        <Toaster />
      </body>
      </html>
    </ClerkProvider>
  )
}
