"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Star, Plus, Minus, Loader2 } from "lucide-react";
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

const fallbackProducts: Record<number, Product> = {
  1: {
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
  2: {
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
  3: {
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
  4: {
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
  5: {
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
  6: {
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
  7: {
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
  8: {
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
};

interface ChatProductCardProps {
  productId: number;
}

export default function ChatProductCard({ productId }: ChatProductCardProps) {
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState<string>("500g");

  // Fetch product data on mount
  useEffect(() => {
    async function fetchProduct() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8088";
        const response = await fetch(`${apiUrl}/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setProduct(data);
            // set default weight based on options
            if (data.price_500g !== null) setSelectedWeight("500g");
            else if (data.price_250g !== null) setSelectedWeight("250g");
            else if (data.price_1000g !== null) setSelectedWeight("1kg");
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn("Backend API not reachable. Using fallback product dataset inside chat.", error);
      }
      
      // Fallback
      const fb = fallbackProducts[productId];
      if (fb) {
        setProduct(fb);
        if (fb.price_500g !== null) setSelectedWeight("500g");
        else if (fb.price_250g !== null) setSelectedWeight("250g");
        else if (fb.price_1000g !== null) setSelectedWeight("1kg");
      }
      setIsLoading(false);
    }
    fetchProduct();
  }, [productId]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white/40 border border-amber-500/10 rounded-2xl">
        <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
        <span className="text-xs text-amber-900/60 ml-2">Loading wellness product...</span>
      </div>
    );
  }

  if (!product) return null;

  const getWeightOptions = (p: Product) => {
    const options = [];
    if (p.price_250g !== null) options.push("250g");
    if (p.price_500g !== null) options.push("500g");
    if (p.price_1000g !== null) options.push("1kg");
    return options;
  };

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

  const getProductImage = (p: Product) => {
    if (p.image_url) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8088";
      return p.image_url.startsWith("/static") ? `${apiUrl}${p.image_url}` : p.image_url;
    }
    return getFallbackImage(p.name);
  };

  const getSelectedPrice = (p: Product, weight: string) => {
    if (weight === "250g") return p.price_250g || 0;
    if (weight === "500g") return p.price_500g || 0;
    if (weight === "1kg") return p.price_1000g || 0;
    return 0;
  };

  const weightOptions = getWeightOptions(product);
  const price = getSelectedPrice(product, selectedWeight);
  const originalPrice = Math.round(price * 1.3);

  // Cart syncing
  const cartItemId = `${product.id}-${selectedWeight}`;
  const cartItem = cartItems.find((item) => item.cart_item_id === cartItemId);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const handleWeightSelect = (weight: string) => {
    setSelectedWeight(weight);
  };

  const handleAddToCart = () => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      image_url: getProductImage(product),
      color: product.color || "from-[#D2B48C] to-[#8B6914]",
    };
    addToCart(cartProduct, selectedWeight, price, false);
  };

  const handleIncrement = () => {
    updateQuantity(cartItemId, currentQuantity + 1);
  };

  const handleDecrement = () => {
    if (currentQuantity === 1) {
      removeFromCart(cartItemId);
    } else {
      updateQuantity(cartItemId, currentQuantity - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-white/70 border border-amber-500/20 rounded-2xl flex gap-3 hover:border-amber-500/35 transition-all duration-300 shadow-sm relative group my-2 max-w-sm"
    >
      {/* Product Image Thumbnail */}
      <div className="w-[80px] h-[80px] min-w-[80px] min-h-[80px] relative overflow-hidden rounded-xl bg-amber-50/50 border border-amber-500/10 flex-shrink-0">
        <Image
          src={getProductImage(product)}
          alt={product.name}
          fill
          sizes="80px"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.tag && (
          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[8px] font-bold z-10">
            {product.tag}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col justify-between flex-grow min-w-0">
        <div>
          <h4 className="text-amber-950 font-bold text-xs leading-tight mb-0.5 truncate">{product.name}</h4>
          
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
            <span className="text-amber-900/80 text-[10px] font-medium">{product.rating}</span>
            <span className="text-amber-800/40 text-[10px]">({product.reviews})</span>
          </div>

          {/* Weight Selectors */}
          <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-none">
            {weightOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => handleWeightSelect(opt)}
                className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border transition-all ${
                  selectedWeight === opt
                    ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                    : "border-amber-500/20 text-amber-900/60 hover:border-amber-500/40 hover:bg-amber-50/50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing and Cart Actions */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-amber-950">₹{price}</span>
            <span className="text-[10px] text-amber-800/40 line-through">₹{originalPrice}</span>
          </div>

          {currentQuantity === 0 ? (
            <button
              onClick={handleAddToCart}
              className="px-3 py-1 rounded-full bg-amber-600 text-white text-[10px] font-semibold hover:bg-amber-700 transition-colors flex items-center gap-1 hover:scale-105 duration-200"
            >
              <ShoppingCart className="w-3 h-3" /> Add
            </button>
          ) : (
            <div className="flex items-center bg-amber-600/10 rounded-full border border-amber-600/20">
              <button
                onClick={handleDecrement}
                className="w-5 h-5 flex items-center justify-center text-amber-700 hover:bg-amber-600 hover:text-white rounded-full transition-colors"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="w-4 text-center text-[10px] font-semibold text-amber-900">
                {currentQuantity}
              </span>
              <button
                onClick={handleIncrement}
                className="w-5 h-5 flex items-center justify-center text-amber-700 hover:bg-amber-600 hover:text-white rounded-full transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
