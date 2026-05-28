"use client";

import { motion } from "framer-motion";

const milestones = [
  { year: "2010", title: "The Beginning", desc: "Kalindi was born in a small warehouse in Mumbai, selling pure almonds door-to-door with a vision of trust and quality." },
  { year: "2014", title: "Pan India", desc: "Expanded to 15 cities, partnering with 100+ farms across India, Afghanistan, and California for premium sourcing." },
  { year: "2018", title: "Digital Leap", desc: "Launched online, reaching 20,000+ customers in the first year and introducing the iconic Royal Gift Box collection." },
  { year: "2024", title: "Legacy of Trust", desc: "50,000+ families trust Kalindi today. FSSAI certified, ISO compliant, and loved by nutritionists across India." },
];

export default function BrandStory() {
  return (
    <section id="story" className="relative py-32 px-6 z-10">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[600px] bg-orange-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Text inside a transparent card */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="p-8 md:p-10 rounded-3xl border border-orange-300/20 bg-[#fff7ed]/30 backdrop-blur-sm text-left"
          >
            <span className="text-orange-600 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Our Story
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-orange-950">
              From Farm to{" "}
              <span className="bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
                Your Family
              </span>
            </h2>
            <p className="text-lg text-orange-900/70 leading-relaxed mb-6 font-light">
              Kalindi was founded on a simple promise — every family in India deserves to eat the best, most natural dry fruits without compromise on quality or price.
            </p>
            <p className="text-orange-900/60 leading-relaxed mb-10 font-light text-sm">
              Named after the sacred Kalindi river — a source of life, nourishment, and purity — our brand carries the spirit of nature&apos;s abundance into every home we serve.
            </p>
            <div className="flex gap-8">
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">15+</p>
                <p className="text-orange-900/60 text-xs mt-1">Years in Business</p>
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">200+</p>
                <p className="text-orange-900/60 text-xs mt-1">Farm Partners</p>
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">9</p>
                <p className="text-orange-900/60 text-xs mt-1">Product Categories</p>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500/50 to-transparent" />
            <div className="space-y-10">
              {milestones.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative pl-16 text-left"
                >
                  <div className="absolute left-0 top-1 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                    {m.year.slice(2)}
                  </div>
                  <p className="text-orange-600 text-xs font-semibold tracking-wider uppercase mb-1">{m.year}</p>
                  <h4 className="text-orange-950 font-bold text-lg mb-2">{m.title}</h4>
                  <p className="text-orange-900/70 text-sm leading-relaxed">{m.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
