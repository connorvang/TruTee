import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import '../../app/globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "TruTee",
  description: "Create and manage tee times for your golf course",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center">
          <p>Please sign in to access this page</p>
        </div>
      </SignedOut>
      <SignedIn>
        {children}
      </SignedIn>
      <Toaster />
    </ClerkProvider>
  );
}
