import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

import FloatingCartButton from "@/components/FloatingCartButton";
import FloatingAgent from "@/components/FloatingAgent";
import ClientDrawerWrapper from "@/components/ClientDrawerWrapper";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Kalindi | Luxury Dry Fruits & Wellness",
  description: "Premium dry fruits crafted for modern wellness. Experience nature's finest luxury.",
  icons: {
    icon: [
      {
        url: "/kalindi.webp",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/kalindi-white-bg.webp",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans`}>
        <AuthProvider>
          <CartProvider>
            <SmoothScroll>
              {children}
            </SmoothScroll>
            <FloatingCartButton />
            <FloatingAgent />
            <ClientDrawerWrapper />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

