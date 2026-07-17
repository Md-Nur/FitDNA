import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ImgBB-hosted selfie / garment / try-on result images
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "ibb.co" },
      // YouCam-rendered try-on result images (various AWS S3 / CloudFront hosts)
      { protocol: "https", hostname: "s3-accelerate.amazonaws.com" },
      { protocol: "https", hostname: "s3.amazonaws.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      // Optional: remote illustration / sample-image host (e.g. sample assets,
      // demo garment photos). Themed SVG illustrations are bundled locally in
      // app/components/illustrations.tsx; this is here if you later want to drop
      // in remote sample images (e.g. https://illustrations.example.com/...).
      { protocol: "https", hostname: "illustrations.example.com" },
    ],
  },
};

export default nextConfig;

