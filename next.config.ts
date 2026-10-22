import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth.js/session flows use request-time crypto; keep this off for the SaaS app.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
