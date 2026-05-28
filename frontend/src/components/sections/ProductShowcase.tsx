"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

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

// Fallback seed products in case API is loading or unavailable
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
  const { addToCart } = useCart();
  const [productsList, setProductsList] = useState<Product[]>(fallbackProducts);
  const [selectedWeights, setSelectedWeights] = useState<Record<number, string>>({});
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

  const getFallbackImage = (productName: string) => {
    const lower = productName.toLowerCase();
    if (lower.includes("almond")) return "/almonds.png";
    if (lower.includes("pistachio")) return "/pistachios.png";
    if (lower.includes("cashew")) return "/cashews.png";
    if (lower.includes("date")) return "/dates.png";
    if (lower.includes("fig")) return "/figs.png";
    if (lower.includes("raisin")) return "/raisins.png";
    if (lower.includes("makhana") || lower.includes("fox")) return "/makhana.png";
    return "/giftbox.png";
  };

  const getProductImage = (product: Product) => {
    if (product.image_url) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8088";
      return product.image_url.startsWith("/static") ? `${apiUrl}${product.image_url}` : product.image_url;
    }
    return getFallbackImage(product.name);
  };

  // Determine weight option list for a product
  const getWeightOptions = (product: Product) => {
    const options = [];
    if (product.price_250g !== null) options.push("250g");
    if (product.price_500g !== null) options.push("500g");
    if (product.price_1000g !== null) options.push("1kg"); // 1000g represented as 1kg for premium branding
    return options;
  };

  // Get selected weight for a product
  const getSelectedWeight = (product: Product) => {
    if (selectedWeights[product.id]) {
      return selectedWeights[product.id];
    }
    const options = getWeightOptions(product);
    return options[0] || "500g";
  };

  // Get price for selected weight
  const getSelectedPrice = (product: Product, weight: string) => {
    if (weight === "250g") return product.price_250g || 0;
    if (weight === "500g") return product.price_500g || 0;
    if (weight === "1kg") return product.price_1000g || 0;
    return 0;
  };

  const handleWeightSelect = (productId: number, weight: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWeights((prev) => ({ ...prev, [productId]: weight }));
  };

  const handleAddToCartClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const weight = getSelectedWeight(product);
    const price = getSelectedPrice(product, weight);
    
    // Map product structure to Cart item structure
    const cartProduct = {
      id: product.id,
      name: product.name,
      image_url: getProductImage(product),
      color: product.color || "from-[#D2B48C] to-[#8B6914]"
    };
    
    addToCart(cartProduct, weight, price);
  };

  return (
    <section id="products" className="relative py-32 px-6 z-10">
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
            Premium{" "}
            <span className="bg-gradient-to-r from-[#D4AF37] to-amber-700 bg-clip-text text-transparent">
              Products
            </span>
          </h2>
          <p className="text-xl text-amber-900/70 max-w-2xl mx-auto font-light">
            Every product handpicked for uncompromising quality, purity, and taste. Select your preferred weight option.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsList.map((product, i) => {
            const weightOptions = getWeightOptions(product);
            const selectedWeight = getSelectedWeight(product);
            const price = getSelectedPrice(product, selectedWeight);
            const originalPrice = Math.round(price * 1.3); // Dynamic original price calculation

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
                whileHover={{ y: -8 }}
                className="group relative rounded-3xl overflow-hidden border border-amber-500/20 bg-amber-50/40 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Product Image Area */}
                  <div className="aspect-square w-full relative overflow-hidden border-b border-amber-500/10">
                    {/* Tag */}
                    {product.tag && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-bold z-10 shadow-sm">
                        {product.tag}
                      </span>
                    )}
                    <Image
                      src={getProductImage(product)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-5 text-left pb-0">
                    <h3 className="text-amber-950 font-bold text-base mb-1 leading-snug">{product.name}</h3>
                    
                    {/* Description (If exists) */}
                    {product.description && (
                      <p className="text-xs text-amber-900/60 line-clamp-2 mb-3 h-8 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span className="text-amber-900/80 text-xs font-medium">{product.rating}</span>
                      <span className="text-amber-800/40 text-xs">({product.reviews.toLocaleString()})</span>
                    </div>

                    {/* Weight Selection Pills */}
                    <div className="flex gap-2 mb-4">
                      {weightOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={(e) => handleWeightSelect(product.id, opt, e)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            selectedWeight === opt
                              ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                              : "border-amber-500/20 text-amber-900/60 hover:border-amber-500/40 hover:bg-amber-50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price and Cart Action */}
                <div className="p-5 pt-2 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-amber-950">₹{price}</span>
                      <span className="text-sm text-amber-800/40 line-through">₹{originalPrice}</span>
                    </div>
                    <button
                      onClick={(e) => handleAddToCartClick(product, e)}
                      className="w-10 h-10 rounded-full bg-amber-600/10 hover:bg-amber-600 text-amber-700 hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-105"
                    >
                      <ShoppingCart className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-14"
        >
          <a
            href="#products"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-amber-500/50 text-amber-700 hover:bg-amber-600 hover:text-white transition-all duration-300 font-medium"
          >
            Explore Full Collection <ShoppingCart className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
