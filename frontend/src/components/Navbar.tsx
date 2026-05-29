"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/collection" },
  { label: "Health", href: "/#health" },
  { label: "Gifts", href: "/#gifts" },
  { label: "Story", href: "/#story" },
  { label: "Contact", href: "/#contact" },
  { label: "Chat (Assistance)", href: "/assistance" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-kalindi-purple/5 backdrop-blur-xl border border-kalindi-purple/20 rounded-2xl px-6 py-3 shadow-[0_8px_32px_rgba(61,26,92,0.05)]">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/kalindi.png"
            alt="Kalindi"
            width={200}
            height={60}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-[#0f1a34]/70 hover:text-kalindi-purple transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl text-[#0f1a34]/70 hover:text-kalindi-purple transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-[#0f1a34]/70" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 rounded-full bg-[#e91e8c] text-white text-[9px] font-bold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </button>
          <Link
            href="/collection"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e91e8c] to-[#be185d] text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(233,30,140,0.4)] transition-all"
          >
            Shop Now
          </Link>
        </div>

        {/* Mobile Menu Button + Cart */}
        <div className="md:hidden flex items-center gap-2">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-xl text-[#0f1a34]/70 hover:text-kalindi-purple transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 rounded-full bg-[#e91e8c] text-white text-[9px] font-bold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </button>
          <button
            className="text-[#0f1a34]/70 hover:text-kalindi-purple p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-2 mx-0 bg-kalindi-purple/5 backdrop-blur-xl border border-kalindi-purple/20 rounded-2xl p-6"
        >
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-[#0f1a34]/70 hover:text-kalindi-purple font-medium py-2 border-b border-kalindi-purple/10"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/collection" onClick={() => setMenuOpen(false)} className="mt-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#e91e8c] to-[#be185d] text-white text-sm font-semibold text-center">
              Shop Now
            </Link>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
