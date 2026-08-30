import * as dotenv from "dotenv";
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev server is reached via the VPS's public IP rather than localhost,
  // so it must be allow-listed or Next.js blocks the dev resource/RSC
  // requests hydration depends on (silently stuck on loading states).
  allowedDevOrigins: ["169.58.224.26"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        port: "",
        pathname: "/brufpbwuzhet/**",
      },
    ],
    domains: ["images.ctfassets.net"],
  },
};

export default nextConfig;
