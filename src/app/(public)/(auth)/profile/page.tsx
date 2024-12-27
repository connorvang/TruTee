'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { SaveChangesNotification } from '@/components/save-changes-notification'
import { SetPasswordDialog } from '@/components/set-password-dialog'
import { MoreHorizontal, Lock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export default function ProfilePage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'personal' | 'golf' | 'billing'>('personal')
  const [isLoading, setIsLoading] = useState(false)
  const initialFormData = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    // Add any other form fields here
  }
  const [formData, setFormData] = useState(initialFormData)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  useEffect(() => {
    const hasFirstNameChanged = formData.firstName !== initialFormData.firstName
    const hasLastNameChanged = formData.lastName !== initialFormData.lastName
    
    setHasChanges(hasFirstNameChanged || hasLastNameChanged)
  }, [formData, initialFormData])

  // Update initialFormData when user data changes
  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    })
  }, [user])

  const handleReset = () => {
    // Reset form data to initial values
    setFormData(initialFormData)
    
    // Reset any form elements to their initial values
    const form = document.querySelector('form')
    if (form) {
      form.reset()
    }
    
    setHasChanges(false)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await user?.update({
        firstName: formData.firstName ?? undefined,
        lastName: formData.lastName ?? undefined,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        className: "bg-green-600 text-white",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating your profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-[960px] py-8">
      {/* Header */}
      <div className="flex w-full items-center mb-8">
        <div className="flex w-full items-start gap-8 flex-col">
          <div className="flex w-full flex-row items-center gap-4">
              <div className="flex relative h-12 w-12">
              {user?.imageUrl && user.imageUrl !== "null" && (
                          <Image
                            src={user.imageUrl}
                            alt="Profile"
                            fill
                            className="rounded-full object-cover"
                          />
                        )}
              </div>
            <div className="flex flex-col items-start gap-0">
              <h1 className="flex text-2xl font-semibold">{user?.firstName} {user?.lastName}</h1>
              <span className="flextext-sm text-gray-500">Handicap: +0.6</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Create payment</Button>
          <Button variant="default">Actions</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" onValueChange={(value) => setActiveTab(value as 'personal' | 'golf' | 'billing')} className="border-b mb-12">
        <TabsList className="bg-transparent border-0">
          <TabsTrigger 
            value="personal" 
            className="border-0 shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2"
          >
            Personal
          </TabsTrigger>
          <TabsTrigger 
            value="golf" 
            className="border-0 shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2"
          >
            Golf
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="border-0 shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2"
          >
            Billing
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="flex flex-row gap-12">
        <div className="flex flex-1">
          {activeTab === 'personal' && (
            <div className="w-full space-y-8">
              <div className="space-y-6">
                <div className="bg-gray-50 p-1 rounded-2xl overflow-hidden">
                  <h2 className="flex flex-col gap-1 text-base font-semibold text-black p-4">Personal information</h2>
                  <div className="bg-white border border-black/6 rounded-xl shadow-sm overflow-hidden p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative h-16 w-16">
                        {user?.imageUrl && user.imageUrl !== "null" && (
                          <Image
                            src={user.imageUrl}
                            alt="Profile"
                            fill
                            className="rounded-full object-cover"
                          />
                        )}
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">Update avatar</Button>
                        <Button variant="ghost" size="sm">Clear</Button>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>First name</Label>
                          <Input 
                            defaultValue={user?.firstName || ''} 
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Last name</Label>
                          <Input 
                            defaultValue={user?.lastName || ''} 
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-1 rounded-2xl overflow-hidden">
                  <h2 className="flex flex-col gap-1 text-base font-semibold text-black p-4">Email addresses</h2>
                  <div className="bg-white border border-black/6 rounded-xl shadow-sm overflow-hidden">
                    {user?.emailAddresses.length === 0 ? (
                      <div className="p-6 text-sm text-gray-500">
                        No email addresses found. Add an email to get started.
                      </div>
                    ) : (
                      user?.emailAddresses.map((email) => (
                        <div 
                          key={email.id}
                          className="flex items-center px-6 py-4 border-b border-gray-100"
                        >
                          <div className="space-y-1 pr-3 flex flex-1 flex-col">
                            <div className="text-sm">{email.emailAddress}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {email.id === user.primaryEmailAddressId && (
                              <Badge className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-50">Primary</Badge>
                            )} 
                            </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <Button variant="link" className="h-auto p-0 text-blue-600">+ Add email</Button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-1 rounded-2xl overflow-hidden">
                  <h2 className="flex flex-col gap-1 text-base font-semibold text-black p-4">Social accounts</h2>
                  <div className="bg-white border border-black/6 rounded-xl shadow-sm overflow-hidden">
                    {user?.externalAccounts.length === 0 ? (
                      <div className="p-6 text-sm text-gray-500">
                        No social accounts connected. Connect an account to get started.
                      </div>
                    ) : (
                      user?.externalAccounts.map((account) => (
                        <div 
                          key={account.id}
                          className="flex items-center px-6 py-4 border-b border-gray-100"
                        >
                          <div className="space-y-1 pr-3 flex flex-1 items-center gap-2">
                            <div className="text-sm">
                              {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)} • {account.emailAddress}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <Button variant="link" className="h-auto p-0 text-blue-600">+ Connect account</Button>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-1 rounded-2xl overflow-hidden">
                  <h2 className="flex flex-col gap-1 text-base font-semibold text-black p-4">Password</h2>
                  <div className="bg-white border border-black/6 rounded-xl shadow-sm overflow-hidden">
                    {user?.passwordEnabled ? (
                      <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Lock className="h-4 w-4" />
                          <span className="text-2xl text-gray-500 tracking-widest">•••••••••</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6">
                        <SetPasswordDialog />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'golf' && (
            <div className="w-full space-y-6">
              Golf information
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="w-full space-y-6">
              Billing information
            </div>
          )}
        </div>
      </div>

      <SaveChangesNotification 
        show={hasChanges}
        onSave={handleUpdateProfile}
        onReset={handleReset}
      />
    </div>
  )
}