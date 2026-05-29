"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Star, Plus, Minus } from "lucide-react";
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

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
  
  // Local state for weight selection
  const [selectedWeight, setSelectedWeight] = useState<string>(() => {
    if (product.price_500g !== null) return "500g";
    if (product.price_250g !== null) return "250g";
    if (product.price_1000g !== null) return "1kg";
    return "500g";
  });

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

  // Check cart status for this specific weight
  const cartItemId = `${product.id}-${selectedWeight}`;
  const cartItem = cartItems.find(item => item.cart_item_id === cartItemId);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const handleWeightSelect = (weight: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWeight(weight);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cartProduct = {
      id: product.id,
      name: product.name,
      image_url: getProductImage(product),
      color: product.color || "from-[#D2B48C] to-[#8B6914]"
    };
    // pass openDrawer = false
    addToCart(cartProduct, selectedWeight, price, false);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(cartItemId, currentQuantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentQuantity === 1) {
      removeFromCart(cartItemId);
    } else {
      updateQuantity(cartItemId, currentQuantity - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.07 }}
      whileHover={{ y: -8 }}
      className="group relative rounded-3xl overflow-hidden border border-amber-500/20 bg-amber-50/40 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Product Image Area */}
        <div className="aspect-square w-full relative overflow-hidden border-b border-amber-500/10">
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
          
          {product.description && (
            <p className="text-xs text-amber-900/60 line-clamp-2 mb-3 h-8 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-1 mb-4">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span className="text-amber-900/80 text-xs font-medium">{product.rating}</span>
            <span className="text-amber-800/40 text-xs">({product.reviews.toLocaleString()})</span>
          </div>

          <div className="flex gap-2 mb-4">
            {weightOptions.map((opt) => (
              <button
                key={opt}
                onClick={(e) => handleWeightSelect(opt, e)}
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
          
          {currentQuantity === 0 ? (
            <button
              onClick={handleAddToCart}
              className="w-10 h-10 rounded-full bg-amber-600/10 hover:bg-amber-600 text-amber-700 hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-105"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
            </button>
          ) : (
            <div className="flex items-center bg-amber-600/10 rounded-full border border-amber-600/20">
              <button 
                onClick={handleDecrement}
                className="w-8 h-8 flex items-center justify-center text-amber-700 hover:bg-amber-600 hover:text-white rounded-full transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-amber-900">
                {currentQuantity}
              </span>
              <button 
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center text-amber-700 hover:bg-amber-600 hover:text-white rounded-full transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
