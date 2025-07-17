/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config: import("webpack").Configuration) {
    if (!config.resolve) config.resolve = {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": __dirname + "/src",
    };
    return config;
  },
  images: {
    domains: ["res.cloudinary.com"],
  },
    env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;


  // images: {
  //   domains: ["res.cloudinary.com"],
  // },
