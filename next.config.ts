import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  outputFileTracingRoot: path.resolve(import.meta.dirname),
};

export default nextConfig;
