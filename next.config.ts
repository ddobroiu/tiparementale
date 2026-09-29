import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autonom: `.next/standalone` conține serverul și doar dependențele
  // folosite la rulare. Imaginea Docker pleacă de acolo, nu din node_modules
  // întreg — de zece ori mai mică și fără unelte de dezvoltare în producție.
  output: "standalone",
  // O singură adresă canonică: https://tiparementale.ro (fără www).
  // www.tiparementale.ro -> 308 pe aceeași cale + query. Se potrivește doar
  // host-ul exact, deci localhost și health check-urile nu sunt atinse.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.tiparementale.ro" }],
        destination: "https://tiparementale.ro/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
