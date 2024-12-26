'use server'

interface SeamAccessCode {
  access_code_id: string;
  name: string;
  code: string;
  status: string;
  starts_at: string;
  ends_at: string;
}

export async function getSeamAccessCodes(accessCodeIds: string[]): Promise<SeamAccessCode[]> {
  // If no IDs provided, return empty array
  if (!accessCodeIds?.length) return [];

  const response = await fetch('https://connect.getseam.com/access_codes/list', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SEAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      access_code_ids: accessCodeIds,
      include_fields: ['access_code_id', 'code', 'name', 'type', 'status', 'starts_at', 'ends_at', 'device_id']
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Seam API error:', errorData);
    // If invalid IDs, return empty array instead of throwing
    if (errorData.includes('invalid_access_code_ids')) {
      return [];
    }
    throw new Error('Failed to fetch access codes from Seam');
  }

  const data = await response.json();
  return data.access_codes;
} 