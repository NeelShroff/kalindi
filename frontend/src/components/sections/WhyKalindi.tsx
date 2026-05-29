"use client";

import { motion } from "framer-motion";
import { Shield, Leaf, Award, Truck, Heart, Star } from "lucide-react";

const reasons = [
  {
    icon: Shield,
    title: "100% Pure & Natural",
    desc: "No preservatives, no artificial colors. Every product is exactly what nature intended.",
  },
  {
    icon: Award,
    title: "FSSAI Certified",
    desc: "Fully certified and compliant with India's highest food safety standards.",
  },
  {
    icon: Leaf,
    title: "Sustainably Sourced",
    desc: "Direct partnerships with farms across India, Afghanistan, California, and Turkey.",
  },
  {
    icon: Truck,
    title: "Fresh Every Batch",
    desc: "Temperature-controlled logistics ensure your dry fruits arrive as fresh as the farm.",
  },
  {
    icon: Heart,
    title: "Loved by 50,000+",
    desc: "A community of wellness-conscious families who trust Kalindi for daily nourishment.",
  },
  {
    icon: Star,
    title: "Luxury Packaging",
    desc: "Premium packaging that makes every box a gift-worthy experience, every time.",
  },
];

export default function WhyKalindi() {
  return (
    <section id="why-kalindi" className="relative pt-14 pb-32 px-6 z-10 bg-[#0a0713]">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#e91e8c]/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-emerald-700 text-sm font-semibold tracking-widest uppercase mb-4 block">
            Why Choose Us
          </span>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-emerald-950">
            The Kalindi{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              Difference
            </span>
          </h2>
          <p className="text-xl text-emerald-900/70 max-w-2xl mx-auto font-light">
            We don&apos;t just sell dry fruits. We deliver trust, purity, and luxury in every order.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="p-8 rounded-3xl border border-emerald-500/20 bg-emerald-50/40 backdrop-blur-sm hover:border-emerald-500/40 hover:bg-emerald-100/30 transition-all duration-300 group text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <reason.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-emerald-950 mb-3">{reason.title}</h3>
              <p className="text-emerald-900/75 leading-relaxed">{reason.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
