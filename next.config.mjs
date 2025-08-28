/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for face-api.js and other Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false,
      }
    }
    
    // Add rule to ignore encoding errors
    config.module.rules.push({
      test: /node_modules\/node-fetch\/lib\/index\.es\.js/,
      resolve: {
        fallback: {
          encoding: false
        }
      }
    })
    
    return config
  },
}

export default nextConfig