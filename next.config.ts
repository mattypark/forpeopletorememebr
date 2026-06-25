import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page renders per-user dynamic data (auth cookies), so partial
  // prerendering adds friction without benefit here.
  cacheComponents: false,
};

export default nextConfig;
