import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sends anyone visiting the site's homepage straight to the editor.
  async redirects() {
    return [{ source: "/", destination: "/editor", permanent: true }];
  },
};

export default nextConfig;
