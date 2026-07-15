import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(","),
  async redirects() {
    return [
      {
        source: "/text-encrypt",
        destination: "/text-converter",
        permanent: true,
      },
      {
        source: "/text-transform",
        destination: "/text-converter",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
