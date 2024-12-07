import '../../app/globals.css'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
        <div className="min-h-screen">
        <header className="border-b border-gray-100 h-16">
        <div className="px-4 w-full max-w-[1920px] mx-auto">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="font-semibold text-xl">
                <Image src="/trutee_logo.svg" alt="TruTee" width={100} height={32} />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <SignedOut>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">Sign in</Button>
                </SignInButton>
                <SignUpButton mode="modal">
              <Button variant="default" size="sm">Sign up</Button>
              </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
                <UserButton showName={true} />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>
          {children}
        </div>
  )
}
