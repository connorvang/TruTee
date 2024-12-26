"use client"

import { useEffect, useState } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { getCustomers, Customer } from '@/actions/getCustomers'
import { Users, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Skeleton component for loading state
const Skeleton = () => (
  <div className="p-0">
    <table className="min-w-full divide-y divide-gray-100">
      <thead>
        <tr className="bg-white border-b border-gray-100">
          <th className="px-6 py-3 max-w-24 text-left text-sm font-medium text-gray-600">Name</th>
          <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email</th>
          <th className="px-6 py-3 max-w-24 text-left text-sm font-medium text-gray-600">GHIN</th>
          <th className="px-6 py-3 max-w-8 text-left text-sm font-medium text-gray-600">Joined</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {Array.from({ length: 5 }).map((_, idx) => (
          <tr key={idx} className="border-b border-gray-100">
            <td className="px-6 py-4 max-w-24">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4 max-w-24">
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4 max-w-8">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default function CustomersList() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { organization } = useOrganization()

  useEffect(() => {
    async function fetchCustomers() {
      if (!organization?.id) return
      
      setLoading(true)
      try {
        const data = await getCustomers(organization.id)
        setCustomers(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching customers:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch customers'))
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [organization?.id])

  const handleRowClick = (customer: Customer) => {
    const user = Array.isArray(customer.users) ? customer.users[0] : customer.users;
    if (user?.id) {
      router.push(`/admin/customers/${user.id}`)
    }
  }

  return (
    <div className="p-0">

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
          <Loader2 className="animate-spin" size={32} />
          Error: {error.message}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
          <Users size={32} />
          <p>No customers yet</p>
        </div>
      ) : (
        <div className="p-0">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-3 max-w-24 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="px-6 py-3 max-w-24 text-left text-sm font-medium text-gray-600">GHIN</th>
                <th className="px-6 py-3 max-w-8 text-left text-sm font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => {
                const user = Array.isArray(customer.users) ? customer.users[0] : customer.users;
                return (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer" 
                    onClick={() => handleRowClick(customer)}
                  >
                    <td className="px-6 py-4 max-w-24 text-sm font-medium text-gray-900">{`${user?.first_name || ''} ${user?.last_name || ''}`}</td>
                    <td className="px-6 py-4 text-sm text-blue-600"><a href={`mailto:${user?.email}`}>{user?.email}</a></td>
                    <td className="px-6 py-4 max-w-24 text-sm text-gray-900">{`${user?.ghin || ''}`}</td>

                    <td className="px-6 py-4 text-sm text-gray-900 max-w-8">
                      {customer.created_at && new Date(customer.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 