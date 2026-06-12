"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Menu, X, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

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
  const { user, openLoginModal, logout } = useAuth();

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
            src="/kalindi.webp"
            alt="Kalindi"
            width={150}
            height={40}
            className="h-9 w-auto object-contain"
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
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => {
              if (user) {
                setIsCartOpen(true);
              } else {
                openLoginModal(() => setIsCartOpen(true));
              }
            }}
            className="relative p-2.5 rounded-xl text-[#0f1a34]/70 hover:text-kalindi-purple transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5 text-[#0f1a34]/70" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 rounded-full bg-[#e91e8c] text-white text-[9px] font-bold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </button>

          {/* Authentication Dropdown/Button */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-kalindi-purple/5 transition-all cursor-pointer">
                {user.picture && !user.picture.includes("unsplash.com") ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-[#D4AF37] object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-[#D4AF37] bg-gradient-to-tr from-[#3d1a5c] to-[#e91e8c] text-white font-bold text-xs flex items-center justify-center shadow-xs select-none">
                    {user.name ? user.name.charAt(0).toUpperCase() : "K"}
                  </div>
                )}
                <span className="hidden lg:inline text-xs text-[#0f1a34]/70 font-semibold truncate max-w-[80px]">
                  {user.name.split(" ")[0]}
                </span>
              </button>
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-[#0f0717]/95 border border-purple-500/20 backdrop-blur-2xl rounded-2xl p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-200 z-50 text-white text-left">
                <p className="font-bold text-xs text-purple-200 truncate">{user.name}</p>
                <p className="text-[10px] text-purple-400 truncate mb-3">{user.email}</p>
                <div className="h-px bg-purple-500/10 my-2" />
                <button
                  onClick={logout}
                  className="w-full text-left py-1.5 text-xs text-[#e91e8c] hover:text-[#f472b6] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openLoginModal()}
              className="px-4.5 py-2 rounded-xl border border-kalindi-purple/20 text-[#0f1a34]/70 hover:text-kalindi-purple hover:bg-kalindi-purple/5 text-xs font-semibold transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}

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
            onClick={() => {
              if (user) {
                setIsCartOpen(true);
              } else {
                openLoginModal(() => setIsCartOpen(true));
              }
            }}
            className="relative p-2 rounded-xl text-[#0f1a34]/70 hover:text-kalindi-purple transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 rounded-full bg-[#e91e8c] text-white text-[9px] font-bold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </button>
          <button
            className="text-[#0f1a34]/70 hover:text-kalindi-purple p-2 cursor-pointer"
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

            {/* Mobile Auth options */}
            {user ? (
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-kalindi-purple/10">
                <div className="flex items-center gap-3 py-2">
                  {user.picture && !user.picture.includes("unsplash.com") ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-9 h-9 rounded-full border border-[#D4AF37] object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full border border-[#D4AF37] bg-gradient-to-tr from-[#3d1a5c] to-[#e91e8c] text-white font-bold text-sm flex items-center justify-center select-none">
                      {user.name ? user.name.charAt(0).toUpperCase() : "K"}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-bold text-xs text-[#0f1a34]">{user.name}</p>
                    <p className="text-[10px] text-[#0f1a34]/60">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  openLoginModal();
                }}
                className="mt-2 py-2.5 rounded-xl bg-kalindi-purple/10 text-kalindi-purple hover:bg-kalindi-purple/20 text-xs font-semibold text-center cursor-pointer"
              >
                Sign In
              </button>
            )}

            <Link href="/collection" onClick={() => setMenuOpen(false)} className="mt-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#e91e8c] to-[#be185d] text-white text-sm font-semibold text-center">
              Shop Now
            </Link>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
