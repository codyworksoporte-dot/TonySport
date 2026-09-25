import type { NextConfig } from 'next';
const githubPages = process.env.TONY_GITHUB_PAGES === 'true';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  ...(githubPages ? { output: 'export' as const, basePath: '/TonySport', trailingSlash: true } : {}),
  env: { TONY_ASSET_BASE: githubPages ? '/TonySport' : '' },
  images: { qualities: [75,85,90], ...(githubPages ? { unoptimized: true } : {}) },
};
export default nextConfig;
