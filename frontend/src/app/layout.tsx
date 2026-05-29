import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

import FloatingCartButton from "@/components/FloatingCartButton";
import FloatingAgent from "@/components/FloatingAgent";
import CartDrawer from "@/components/CartDrawer";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Kalindi | Luxury Dry Fruits & Wellness",
  description: "Premium dry fruits crafted for modern wellness. Experience nature's finest luxury.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans`}>
        <CartProvider>
          <SmoothScroll>
            {children}
          </SmoothScroll>
          <FloatingCartButton />
          <FloatingAgent />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}

