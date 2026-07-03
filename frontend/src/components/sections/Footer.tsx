"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Instagram, MessageCircle, AtSign, Mail, Phone, MapPin, ArrowRight, Copy, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText("FIRST7");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: "Kalindi Dry Fruits & Wellness",
        text: "Premium dry fruits and luxury wellness gifts.",
        url: typeof window !== "undefined" ? window.location.origin : "",
      }).catch((err) => console.log(err));
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.origin : "");
      alert("Link copied to clipboard!");
    }
  };

  return (
    <footer id="contact" className="relative z-10 bg-transparent border-t border-kalindi-purple/20">
      {/* Newsletter/Coupon CTA */}
      <div className="relative py-20 px-6 bg-kalindi-purple/5 backdrop-blur-md border-b border-kalindi-purple/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(circle_at_center,rgba(233,30,140,0.12)_0%,transparent_70%)]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-kalindi-purple">
              Get{" "}
              <span className="bg-gradient-to-r from-[#e91e8c] to-[#f472b6] bg-clip-text text-transparent">
                7% Off
              </span>{" "}
              Your First Order
            </h2>
            <p className="text-[#0f1a34]/70 mb-8 text-lg font-light">
              Use the coupon code below at checkout to enjoy a special discount on your first purchase.
            </p>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleCopyCode}
                className="relative inline-flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-white/40 border border-[#e91e8c]/25 hover:border-[#e91e8c]/50 shadow-xs backdrop-blur-xs cursor-pointer select-all group transition-all duration-300 active:scale-98"
              >
                <div className="text-left">
                  <div className="text-[10px] font-bold text-kalindi-purple/50 uppercase tracking-widest">Coupon Code</div>
                  <div className="text-xl font-black text-[#e91e8c] tracking-wider font-mono">FIRST7</div>
                </div>
                <div className="h-8 w-px bg-kalindi-purple/10" />
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#0f1a34]/70 group-hover:text-[#e91e8c] transition-colors">
                  {copied ? (
                    <>
                      <Check className="w-4.5 h-4.5 text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4.5 h-4.5" /> Click to Copy
                    </>
                  )}
                </span>
              </button>
              <p className="text-xs font-medium text-kalindi-purple/60 mt-1 block">
                *Valid on first orders above ₹1,500 only.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-6">
              <Image
                src="/kalindi.webp"
                alt="Kalindi"
                width={180}
                height={60}
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-[#0f1a34]/70 text-sm leading-relaxed mb-6">
              Premium dry fruits and wellness gifts for those who believe the best things in life should be both healthy and luxurious.
            </p>
            <div className="flex gap-3">
              {/* WhatsApp */}
              <a
                href="https://wa.me/918850353695"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-kalindi-purple/25 hover:border-[#e91e8c] hover:bg-[#e91e8c]/10 transition-all flex items-center justify-center group"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-[#0f1a34]/60 group-hover:text-[#e91e8c]" />
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/kalindi_dryfruit/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-kalindi-purple/25 hover:border-[#e91e8c] hover:bg-[#e91e8c]/10 transition-all flex items-center justify-center group"
                title="Follow on Instagram"
              >
                <Instagram className="w-4 h-4 text-[#0f1a34]/60 group-hover:text-[#e91e8c]" />
              </a>

              {/* Email */}
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=kalindidryfruit@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-kalindi-purple/25 hover:border-[#e91e8c] hover:bg-[#e91e8c]/10 transition-all flex items-center justify-center group"
                title="Send Email"
              >
                <AtSign className="w-4 h-4 text-[#0f1a34]/60 group-hover:text-[#e91e8c]" />
              </a>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full border border-kalindi-purple/25 hover:border-[#e91e8c] hover:bg-[#e91e8c]/10 transition-all flex items-center justify-center group"
                title="Share Website"
              >
                <Share2 className="w-4 h-4 text-[#0f1a34]/60 group-hover:text-[#e91e8c]" />
              </button>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-kalindi-purple font-semibold mb-6">Shop</h4>
            <ul className="space-y-3 text-sm text-[#0f1a34]/70">
              <li>
                <a href="/collection" className="hover:text-[#e91e8c] transition-colors">All Products</a>
              </li>
              <li>
                <a href="/#gifts" className="hover:text-[#e91e8c] transition-colors">Gift Boxes</a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-kalindi-purple font-semibold mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-[#0f1a34]/70">
              <li>
                <a href="/#story" className="hover:text-[#e91e8c] transition-colors">Our Story</a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-[#e91e8c] transition-colors">FAQ</a>
              </li>
              <li>
                <a href="/assistance" className="hover:text-[#e91e8c] transition-colors">AI Assistant</a>
              </li>
              <li>
                <a href="/#contact" className="hover:text-[#e91e8c] transition-colors">Contact Us</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-kalindi-purple font-semibold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-[#0f1a34]/70">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#e91e8c] mt-0.5 flex-shrink-0" />
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=kalindidryfruit@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0f1a34]/80 hover:text-[#e91e8c] transition-colors"
                >
                  kalindidryfruit@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#e91e8c] mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <a href="tel:+919930506270" className="text-[#0f1a34]/80 hover:text-[#e91e8c] transition-colors">
                    +91 9930506270 (Pratibha)
                  </a>
                  <a href="tel:+918850353695" className="text-[#0f1a34]/80 hover:text-[#e91e8c] transition-colors">
                    +91 8850353695 (Ketan)
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#e91e8c] mt-0.5 flex-shrink-0" />
                <span className="text-[#0f1a34]/80">1303, shree royal height, ashok nagar<br />kandivali-east, Mumbai-400101</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-kalindi-purple/20 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <p className="text-[#0f1a34]/60 text-xs text-center sm:text-left">
              © 2024 Kalindi Dry Fruits. All rights reserved.
            </p>
            <div className="flex items-center justify-center gap-2 bg-white/90 px-2.5 py-1 rounded border border-kalindi-purple/10 shadow-sm h-8">
              <Image
                src="/image.webp"
                alt="FSSAI Logo"
                width={50}
                height={20}
                className="h-5 w-auto object-contain"
              />
              <span className="text-[10px] font-bold text-[#0f1a34]/80 border-l border-kalindi-purple/20 pl-2 tracking-wider">
                21521053000260
              </span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#0f1a34]/60">
            {["Privacy Policy", "Terms of Service", "Shipping Policy", "Returns"].map((l) => (
              <a key={l} href="#" className="hover:text-[#e91e8c] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
