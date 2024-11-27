import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import localFont from "next/font/local";
import { Button } from '@/components/ui/button';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "TruTee",
  description: "Create and manage tee times for your golf course",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
              <SignedOut>
              <SignInButton>
                <Button className="px-4 py-2 rounded-md mr-4">Sign in</Button>
              </SignInButton>
              <SignUpButton>
                <Button variant="outline" className="px-4 py-2 rounded-md">Sign up</Button>
              </SignUpButton>
              </SignedOut>
              <SignedIn>
                <main>
                  {children}
                </main>
                <Toaster />
              </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
