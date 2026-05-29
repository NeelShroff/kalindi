"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function FloatingCartButton() {
  const { cartCount, cartTotal, setIsCartOpen } = useCart();
  const pathname = usePathname();

  // Hide the floating cart button on the assistance page to avoid overlapping the chat input
  if (pathname === "/assistance") return null;

  return (
    <AnimatePresence>
      {cartCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
        >
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-900/20 rounded-full py-4 px-6 flex items-center justify-between transition-colors duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-white text-amber-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="font-semibold text-sm">View Cart</span>
            </div>
            <div className="font-bold">
              ₹{cartTotal.toFixed(2)}
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
