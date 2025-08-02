/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@coworking/ui", "@coworking/database", "@coworking/auth", "@coworking/config", "@coworking/utils"],
  experimental: {
    serverComponentsExternalPackages: ["mongoose"]
  },
  images: {
    domains: ['res.cloudinary.com']
  }
}

module.exports = nextConfig