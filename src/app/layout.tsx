import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { ClerkProvider } from '@clerk/nextjs' 


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
    <ClerkProvider>
    <html lang="en">
      <body className='antialiased'>
        <div className="min-h-screen">
          {children}
        </div>
        <Toaster />
      </body>
      </html>
    </ClerkProvider>
  )
}
