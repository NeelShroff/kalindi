import type { NextConfig } from "next";

const remotePatterns: Array<{
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname: string;
}> = [
  {
    protocol: 'http',
    hostname: 'localhost',
    port: '8088',
    pathname: '/**',
  },
  {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: '8088',
    pathname: '/**',
  },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (apiUrl) {
  try {
    const parsedUrl = new URL(apiUrl);
    const protocol = parsedUrl.protocol.replace(':', '') as 'http' | 'https';
    const hostname = parsedUrl.hostname;
    const port = parsedUrl.port;
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const pattern: {
        protocol: 'http' | 'https';
        hostname: string;
        port?: string;
        pathname: string;
      } = {
        protocol,
        hostname,
        pathname: '/**',
      };
      if (port) {
        pattern.port = port;
      }
      remotePatterns.push(pattern);
    }
  } catch (e) {
    console.error("Failed to parse NEXT_PUBLIC_API_URL in next.config.ts:", e);
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;

