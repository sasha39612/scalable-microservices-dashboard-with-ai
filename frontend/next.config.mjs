import * as dotenv from "dotenv";
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
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
