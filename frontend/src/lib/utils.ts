import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

export function getFallbackImage(productName: string): string {
  return "/kalindi.webp";
}

export function getProductImage(product: { image_url: string | null; name: string }): string {
  if (product.image_url) {
    if (product.image_url.startsWith("http://") || product.image_url.startsWith("https://")) {
      return product.image_url;
    }
    
    if (typeof window !== "undefined") {
      // Client-side: if running on local Next.js dev server (port 3000), prepend the configured API URL.
      // Otherwise in production (where Nginx proxies /static to the backend), use relative path to avoid SSL/mixed-content blocks.
      if (window.location.port === "3000") {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8088";
        const cleanApiUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
        return `${cleanApiUrl}${product.image_url}`;
      }
      return product.image_url;
    }
    
    // Server-side / SSR: use NEXT_PUBLIC_API_URL if configured
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const cleanApiUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
    return `${cleanApiUrl}${product.image_url}`;
  }
  return getFallbackImage(product.name);
}

