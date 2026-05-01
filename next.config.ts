import path from "node:path";
import type { NextConfig } from "next";

// Pin the workspace root to this folder. Without this, Next.js / Turbopack
// walks up looking for a lockfile and may pick the parent (which contains a
// Python project), breaking module resolution (e.g. "Can't resolve 'tailwindcss'").
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
