"use client";

import { motion } from "framer-motion";

const benefits = [
  { emoji: "🧠", name: "Brain Health", benefit: "Rich in Omega-3 and antioxidants for cognitive function." },
  { emoji: "💪", name: "Strength & Energy", benefit: "Packed with proteins and healthy fats for sustained energy." },
  { emoji: "❤️", name: "Heart Health", benefit: "Reduces bad cholesterol and supports cardiovascular health." },
  { emoji: "🌙", name: "Better Sleep", benefit: "Natural magnesium and melatonin precursors in walnuts & almonds." },
  { emoji: "✨", name: "Skin Glow", benefit: "Vitamin E and healthy fats for radiant, youthful skin." },
  { emoji: "🛡️", name: "Immunity Boost", benefit: "Zinc, selenium, and antioxidants strengthen your immune system." },
];

export default function HealthBenefits() {
  return (
    <section id="health" className="relative py-32 px-6 z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left: Text inside a transparent card */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="p-8 md:p-10 rounded-3xl border border-kalindi-purple/20 bg-kalindi-purple/5 backdrop-blur-sm text-left"
          >
            <span className="text-[#e91e8c] text-sm font-semibold tracking-widest uppercase mb-4 block">
              Wellness First
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-kalindi-purple">
              Eat Well,{" "}
              <span className="bg-gradient-to-r from-[#e91e8c] to-[#f472b6] bg-clip-text text-transparent">
                Live Well
              </span>
            </h2>
            <p className="text-lg text-[#0f1a34]/70 leading-relaxed mb-8 font-light">
              Every Kalindi product is nature's own pharmacy — powerhouse of nutrients that fuel your mind, body, and soul every single day.
            </p>
            <div className="flex items-center gap-4 p-5 rounded-2xl border border-[#e91e8c]/20 bg-[#e91e8c]/5">
              <span className="text-4xl">🌿</span>
              <p className="text-[#0f1a34]/80 text-sm leading-relaxed">
                <span className="text-kalindi-purple font-semibold">Ayurvedic Wisdom Meets Modern Science.</span>{" "}
                Our products are recommended by nutritionists and align with traditional Indian wellness practices.
              </p>
            </div>
          </motion.div>

          {/* Right: Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-5 rounded-2xl border border-kalindi-purple/20 bg-kalindi-purple/5 hover:border-[#e91e8c]/30 transition-all duration-300 text-left"
              >
                <div className="text-3xl mb-3">{b.emoji}</div>
                <h4 className="text-kalindi-purple font-semibold mb-1">{b.name}</h4>
                <p className="text-[#0f1a34]/70 text-sm leading-relaxed">{b.benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
