/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['connect.getseam.com'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'dojqhpsjixkzrqxldxrz.supabase.co',
          port: '',
          pathname: '/storage/v1/object/public/**',
        }
      ],
    },
  }

export default nextConfig;
