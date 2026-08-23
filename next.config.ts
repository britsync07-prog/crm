import type { NextConfig } from "next";

const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self';
  connect-src 'self' https: wss:;
  worker-src 'self' blob:;
  frame-src 'self' https://meet.truecrm.online;
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path((?:admin|api|automations|billing|calendar|calls|campaigns|customers|forms|inbox|leads|meet|onboarding|portal|settings|social|team).*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
