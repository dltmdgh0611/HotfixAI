/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // Allow native/binary deps to be loaded at runtime in server routes
    serverComponentsExternalPackages: ['ssh2-sftp-client', 'ssh2', 'basic-ftp'],
  },
  webpack: (config) => {
    // Prevent bundler from trying to parse native .node from ssh2
    config.externals = config.externals || []
    config.externals.push({ ssh2: 'commonjs ssh2' })
    return config
  },
}

module.exports = nextConfig