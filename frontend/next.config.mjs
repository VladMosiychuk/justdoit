import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // The shared contracts package ships TypeScript/ESM that Next must transpile.
  transpilePackages: ["@justdoit/contracts"],
  eslint: {
    // Linting is handled separately; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
  experimental: {
    outputFileTracingRoot: path.join(__dirname, ".."),
  },
};

export default nextConfig;
