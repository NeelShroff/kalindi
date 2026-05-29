"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import ProductCard from "../ProductCard";

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

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Premium California Almonds",
    description: "Handpicked, crispy, and highly nutritious sweet California almonds.",
    price_250g: 279,
    price_500g: 499,
    price_1000g: 949,
    image_url: "/almonds.png",
    tag: "Best Seller",
    color: "from-[#D2B48C] to-[#8B6914]",
    rating: 4.9,
    reviews: 2341,
  },
  {
    id: 2,
    name: "Saffron Pistachios",
    description: "Exquisite pistachios roasted and delicately seasoned with premium Kashmiri saffron.",
    price_250g: 399,
    price_500g: 699,
    price_1000g: 1299,
    image_url: "/pistachios.png",
    tag: "Premium",
    color: "from-[#8B9467] to-[#556B2F]",
    rating: 4.8,
    reviews: 1892,
  },
  {
    id: 3,
    name: "Royal Cashews W320",
    description: "Whole, white jumbo cashews (W320 grade) known for their rich buttery taste.",
    price_250g: 299,
    price_500g: 549,
    price_1000g: 999,
    image_url: "/cashews.png",
    tag: "Top Rated",
    color: "from-[#F5DEB3] to-[#D2691E]",
    rating: 4.9,
    reviews: 3102,
  },
  {
    id: 4,
    name: "Medjool Dates",
    description: "Soft, sweet, and highly luscious Medjool dates imported fresh from the Middle East.",
    price_250g: 289,
    price_500g: 449,
    price_1000g: 849,
    image_url: "/dates.png",
    tag: "Natural",
    color: "from-[#8B4513] to-[#3D1F00]",
    rating: 4.7,
    reviews: 987,
  },
  {
    id: 5,
    name: "Turkish Figs",
    description: "Plump, sun-dried, and premium grade figs imported directly from Izmir, Turkey.",
    price_250g: 379,
    price_500g: 699,
    price_1000g: 1299,
    image_url: "/figs.png",
    tag: "Imported",
    color: "from-[#7B3F8C] to-[#3d1a5c]",
    rating: 4.8,
    reviews: 765,
  },
  {
    id: 6,
    name: "Jumbo Raisins",
    description: "Sweet and juicy green jumbo raisins naturally dried to preserve goodness.",
    price_250g: 169,
    price_500g: 299,
    price_1000g: 549,
    image_url: "/raisins.png",
    tag: "Value Pack",
    color: "from-[#722F37] to-[#3D0C11]",
    rating: 4.6,
    reviews: 1543,
  },
  {
    id: 7,
    name: "Fox Nuts (Makhana)",
    description: "Healthy, roasted, popped fox nuts perfect for low-calorie weight loss snacking.",
    price_250g: 249,
    price_500g: 449,
    price_1000g: null,
    image_url: "/makhana.png",
    tag: "Healthy",
    color: "from-[#F5F5DC] to-[#D2B48C]",
    rating: 4.8,
    reviews: 2104,
  },
  {
    id: 8,
    name: "Kalindi Assorted Gift Box",
    description: "A luxury assortments collection of Almonds, Cashews, Pistachios, and Figs.",
    price_250g: null,
    price_500g: null,
    price_1000g: 1299,
    image_url: "/giftbox.png",
    tag: "Gift Ready",
    color: "from-[#e91e8c] to-[#3d1a5c]",
    rating: 5.0,
    reviews: 542,
  },
];

export default function ProductShowcase() {
  const [productsList, setProductsList] = useState<Product[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from backend on mount
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
        console.warn("Backend API not reachable. Using fallback product dataset.", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Limit to exactly 8 newly added items
  const displayProducts = productsList.slice(0, 8);

  return (
    <section id="products" className="relative pt-32 pb-14 px-6 z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-amber-600 text-sm font-semibold tracking-widest uppercase mb-4 block">
            Our Collection
          </span>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-amber-950">
            Newly Added{" "}
            <span className="bg-gradient-to-r from-[#D4AF37] to-amber-700 bg-clip-text text-transparent">
              Items
            </span>
          </h2>
          <p className="text-xl text-amber-900/70 max-w-2xl mx-auto font-light">
            Every product handpicked for uncompromising quality, purity, and taste. Select your preferred weight option.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-14"
        >
          <Link
            href="/collection"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-amber-500/50 text-amber-700 hover:bg-amber-600 hover:text-white transition-all duration-300 font-medium"
          >
            Explore Full Collection <ShoppingCart className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
