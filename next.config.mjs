/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'connect.getseam.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'dojqhpsjixkzrqxldxrz.supabase.co',
          port: '',
          pathname: '/storage/v1/object/public/**',
        }
      ],
    },
    transpilePackages: ['seam'],
    webpack: (config) => {
      config.resolve.fallback = { 
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
      return config;
    },
  }

export default nextConfig;
