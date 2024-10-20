/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'oaidalleapiprodscus.blob.core.windows.net',
      // Add any other domains you're using for images here
    ],
  },
}

module.exports = nextConfig