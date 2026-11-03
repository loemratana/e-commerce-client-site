/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow opening the dev server through a Cloudflare quick tunnel (https://<name>.trycloudflare.com)
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // product images uploaded through the API
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

module.exports = nextConfig;
