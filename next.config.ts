import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autonom: `.next/standalone` conține serverul și doar dependențele
  // folosite la rulare. Imaginea Docker pleacă de acolo, nu din node_modules
  // întreg — de zece ori mai mică și fără unelte de dezvoltare în producție.
  output: "standalone",
};

export default nextConfig;
