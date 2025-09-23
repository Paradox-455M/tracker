import type { NextConfig } from "next";

let withBundleAnalyzer: (config: NextConfig) => NextConfig = (config) => config;
if (process.env.ANALYZE === "true") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const analyzer = require("@next/bundle-analyzer");
    withBundleAnalyzer = analyzer({ enabled: true });
  } catch (err) {
    console.warn("@next/bundle-analyzer not installed. Run `npm i -D @next/bundle-analyzer` to enable analysis.");
  }
}

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors
    ignoreDuringBuilds: false,
  },
};

export default withBundleAnalyzer(nextConfig);
