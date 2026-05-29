"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";

interface Product {
  id: number;
  name: string;
  description?: string;
  price_250g: number | null;
  price_500g: number | null;
  price_1000g: number | null;
  image_url: string | null;
  tag: string | null;
  color: string | null;
  rating: number;
  reviews: number;
}

export default function CollectionPage() {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8088";
        const response = await fetch(`${apiUrl}/api/products`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setProductsList(data);
          }
        }
      } catch (error) {
        console.warn("Backend API not reachable.", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-amber-50/30 selection:bg-amber-500/30">
      <Navbar />
      
      <div className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-amber-950 mb-4">
            Full <span className="bg-gradient-to-r from-[#D4AF37] to-amber-700 bg-clip-text text-transparent">Collection</span>
          </h1>
          <p className="text-lg text-amber-900/70 max-w-2xl mx-auto">
            Discover our entire range of premium, hand-picked dry fruits and nuts.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsList.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
