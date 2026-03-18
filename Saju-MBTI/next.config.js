/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: 'out',

  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@capacitor/core',
      'firebase'
    ],
  },

  // Turbopack configuration (Next.js 16+)
  turbopack: {},

  // Webpack optimizations (fallback for --webpack builds)
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Split chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            },
            // Framer Motion separate chunk (large library)
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Firebase separate chunk (large library)
            firebase: {
              name: 'firebase',
              test: /[\\/]node_modules[\\/]firebase[\\/]/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
}

module.exports = nextConfig
