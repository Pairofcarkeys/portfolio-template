import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'export',
  // `next dev` builds into its own folder, so `pnpm check` can run beside a live dev server.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  outputFileTracingRoot: path.resolve(import.meta.dirname),
};

export default nextConfig;
