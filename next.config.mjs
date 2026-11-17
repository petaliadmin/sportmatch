/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Relative asset paths so the static build runs from any folder or host.
  assetPrefix: "./",
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
