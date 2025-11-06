import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Use Webpack for production builds to avoid Turbopack font fetch issues in CI/CD
  // Turbopack is still used for dev server (npm run dev)
}

export default nextConfig
