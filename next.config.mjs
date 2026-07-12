/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    outputFileTracingIncludes: {
      "/**/*": ["./prisma/dev.db"]
    }
  }
};

export default nextConfig;
