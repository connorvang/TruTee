'use client'

import { useEffect, useState, useCallback } from 'react';
import { getUserAccessCodes } from '@/actions/security/getUserAccessCodes';
import { getSeamAccessCodes } from '@/actions/security/getSeamAccessCodes';
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateAccessCodeDialog } from './CreateCustomerAccessCodeDialog';

interface AccessCode {
  access_code_id: string;
  device_id?: string;
  name: string;
  code: string;
  status: string;
  starts_at: string;
  ends_at: string;
  type?: string;
}

interface AccessCodesListProps {
  userId: string;
  devices: Array<{ device_id: string; name: string; }>;
}

export default function AccessCodesList({ userId, devices }: AccessCodesListProps) {

  const { toast } = useToast();
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccessCodes = useCallback(async (background = false) => {
    try {
      if (!background) {
        setIsLoading(true);
      }
      const userAccessCodes = await getUserAccessCodes(userId);
      const accessCodeIds = userAccessCodes.map(uac => uac.access_code_id);
      const seamAccessCodes = await getSeamAccessCodes(accessCodeIds);
      setAccessCodes(seamAccessCodes);
    } catch (error) {
      console.error('Error fetching access codes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Initial fetch
    fetchAccessCodes();
    
    // Set up polling interval (every 10 seconds)
    const pollInterval = setInterval(() => {
      fetchAccessCodes(true); // true = background refresh
    }, 10000);
    
    // Cleanup on unmount
    return () => clearInterval(pollInterval);
  }, [fetchAccessCodes]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      description: "Code copied to clipboard",
      duration: 2000,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  };

  const Skeleton = () => (
    <div className="flex flex-col">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="flex items-center border-b p-4 border-gray-100">
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 w-full">
      
      <div className="bg-gray-50 p-1 rounded-2xl overflow-hidden">
        <div className="flex flex-col gap-1 text-md font-semibold text-black p-4">Access codes</div>
          <div className="bg-white border border-black/6 rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <Skeleton />
          ) : accessCodes.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No access codes found.
            </div>
          ) : (
            <>
              {accessCodes.map((code) => {
                const device = devices.find(d => d.device_id === code.device_id);
                
                return (
                  <div 
                    key={code.access_code_id} 
                    className="flex items-center p-4 border-b border-gray-100"
                  >
                    <div className="space-y-1 pr-3 flex flex-1 flex-col">
                      <div className="text-base font-medium">{code.name || 'Unnamed Code'}</div>
                      <div className="text-sm text-gray-500">
                        {code.type === 'ongoing' ? 'Ongoing' : 
                          `${code.starts_at ? formatDate(code.starts_at) : ''} → ${code.ends_at ? formatDate(code.ends_at) : ''}`}
                      </div>
                    </div>
                    <div className="flex flex-col text-sm">
                        {device?.name || 'Unknown Device'}
                    </div>
                    <div className="flex items-center px-3 justify-end gap-3 w-40">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => copyCode(code.code)}
                              className="text-sm font-medium border bg-gray-50 border-gray-200 py-0 px-2"
                            >
                              <span className="text-sm font-medium">{code.code}</span>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy access code</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex px-3 items-center gap-2 w-32">
                      <div className={`h-2 w-2 rounded-full ${
                        code.status === 'set' ? 'bg-green-500' : 
                        code.status === 'setting' ? 'bg-yellow-500' :
                        code.status === 'removing' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm">{code.status === 'set' ? 'Set' : 
                        code.status === 'setting' ? 'Setting' :
                        code.status === 'removing' ? 'Removing' :
                        'Unset'
                      }</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <CreateAccessCodeDialog 
            userId={userId} 
            devices={devices} 
            onAccessCodeCreated={fetchAccessCodes} 
          />
        </div>
      </div>
    </div>
  );
} 