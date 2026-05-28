"use client";

import { motion } from "framer-motion";
import { Share2, MessageSquare, AtSign, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer id="contact" className="relative z-10 bg-transparent border-t border-kalindi-purple/20">
      {/* Newsletter CTA */}
      <div className="relative py-20 px-6 bg-kalindi-purple/5 backdrop-blur-md border-b border-kalindi-purple/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#e91e8c]/15 blur-[100px]" />
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
                10% Off
              </span>{" "}
              Your First Order
            </h2>
            <p className="text-[#0f1a34]/70 mb-8 text-lg font-light">
              Subscribe to receive exclusive offers, seasonal drops, and wellness tips straight to your inbox.
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 rounded-full bg-kalindi-purple/5 border border-kalindi-purple/20 text-[#0f1a34] placeholder:text-[#0f1a34]/40 focus:outline-none focus:border-[#e91e8c]/60 transition-colors"
              />
              <button className="px-6 py-4 rounded-full bg-gradient-to-r from-[#e91e8c] to-[#be185d] text-white font-semibold hover:shadow-[0_0_30px_rgba(233,30,140,0.5)] transition-all duration-300 flex items-center gap-2">
                Subscribe <ArrowRight className="w-4 h-4" />
              </button>
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
                src="/kalindi.png"
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
              {[Share2, MessageSquare, AtSign].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-full border border-kalindi-purple/25 hover:border-[#e91e8c] hover:bg-[#e91e8c]/10 transition-all flex items-center justify-center group">
                  <Icon className="w-4 h-4 text-[#0f1a34]/60 group-hover:text-[#e91e8c]" />
                </button>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-kalindi-purple font-semibold mb-6">Shop</h4>
            <ul className="space-y-3 text-sm text-[#0f1a34]/70">
              {["Almonds", "Cashews", "Pistachios", "Raisins & Dates", "Makhana", "Gift Boxes", "Healthy Snacks"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-[#e91e8c] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-kalindi-purple font-semibold mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-[#0f1a34]/70">
              {["About Us", "Our Story", "Blog & Recipes", "Press", "Careers", "Corporate Gifting", "Franchise"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-[#e91e8c] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-kalindi-purple font-semibold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-[#0f1a34]/70">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#e91e8c] mt-0.5 flex-shrink-0" />
                <span className="text-[#0f1a34]/80">kalindidryfruit@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#e91e8c] mt-0.5 flex-shrink-0" />
                <span className="text-[#0f1a34]/80">+91 8850353695</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#e91e8c] mt-0.5 flex-shrink-0" />
                <span className="text-[#0f1a34]/80">1303,shree royal height ,ashok nagar
kandivali-east,<br />Mumbai-4000101</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-kalindi-purple/20 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#0f1a34]/60 text-xs">
            © 2024 Kalindi Dry Fruits. All rights reserved. FSSAI: 11221999000425
          </p>
          <div className="flex gap-6 text-xs text-[#0f1a34]/60">
            {["Privacy Policy", "Terms of Service", "Shipping Policy", "Returns"].map((l) => (
              <a key={l} href="#" className="hover:text-[#e91e8c] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
