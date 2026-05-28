"use client";

import { motion } from "framer-motion";
import { Package, Sparkles } from "lucide-react";
import Image from "next/image";

const packagingFeatures = [
  { title: "Food-Safe Materials", desc: "All boxes use premium, food-grade, eco-friendly materials with zero plastic contact." },
  { title: "Vacuum Sealed", desc: "Every product is nitrogen-flushed and vacuum-sealed to lock in maximum freshness." },
  { title: "Luxury Presentation", desc: "Magnetic closures, velvet inserts, and gold accents for a true luxury unboxing experience." },
  { title: "Eco Conscious", desc: "Fully recyclable packaging. 1% of all revenue goes to forest conservation." },
];

export default function PackagingExperience() {
  return (
    <section id="packaging" className="relative py-32 px-6 z-10">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Packaging Visual */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Main Interactive Parallax Container */}
            <div className="relative w-full h-[520px] max-w-md mx-auto rounded-[32px] overflow-hidden bg-gradient-to-b from-[#180e29]/30 to-[#0c0617]/10 border border-purple-500/10 shadow-2xl cursor-pointer group">
              <div className="absolute inset-0 bg-[#07030b]/40 backdrop-blur-[2px] pointer-events-none" />
              
              <div className="relative w-full h-full flex items-center justify-center p-8">
                
                {/* LAYER 1: BASE CONTAINER (Velvet Base silhouette - stays centered) */}
                <div className="absolute w-[240px] h-[240px] bg-gradient-to-br from-[#12081f] to-[#07030b] rounded-[24px] border-2 border-purple-950/60 shadow-inner flex items-center justify-center transition-all duration-700 group-hover:scale-95">
                  <div className="absolute inset-3 border border-purple-900/15 rounded-[18px] flex items-center justify-center opacity-40">
                    <span className="text-[9px] tracking-[0.3em] text-[#fae8ff]/20 font-black">VACUUM CHAMBER</span>
                  </div>
                </div>

                {/* LAYER 2: THE TRAY WITH GOLD JARS (Reveals and slides top-right) */}
                <div className="absolute w-[230px] h-[230px] bg-[#0f0717]/95 rounded-[22px] border border-[#D4AF37]/25 shadow-lg flex flex-col justify-around p-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-20 group-hover:-translate-y-20 group-hover:scale-105 group-hover:rotate-[4deg] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-10">
                  <span className="text-[8px] text-[#D4AF37] font-black uppercase tracking-[0.25em] text-center">Keepsake Drawer</span>
                  
                  {/* 3 Premium Glass Jars */}
                  <div className="grid grid-cols-3 gap-3 z-10 my-auto items-end px-2">
                    {[
                      { name: "Almonds", image: "/almonds.png" },
                      { name: "Cashews", image: "/cashews.png" },
                      { name: "Pistachios", image: "/pistachios.png" }
                    ].map((jar, index) => (
                      <div 
                        key={jar.name} 
                        className="flex flex-col group-hover:translate-y-[-8px] transition-transform duration-500 ease-out"
                        style={{ transitionDelay: `${index * 100}ms` }}
                      >
                        {/* Shiny Gold Lid */}
                        <div className="h-3 w-11/12 mx-auto bg-gradient-to-r from-[#AA7C11] via-[#D4AF37] to-[#AA7C11] rounded-t-md shadow-md border-b border-[#fdf5d6]/25" />
                        
                        {/* Translucent Glass Jar Body */}
                        <div className="h-28 w-full bg-gradient-to-b from-white/10 to-white/[0.03] border border-white/10 rounded-b-xl backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-between py-3 shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                          {/* Highlights on glass */}
                          <div className="absolute left-1 top-0 bottom-0 w-[2px] bg-white/20 rounded-full" />
                          <div className="absolute right-1 top-0 bottom-0 w-[1px] bg-white/5 rounded-full" />
                          
                          {/* Food Content Preview using real image */}
                          <div className="w-14 h-14 relative flex items-center justify-center px-1">
                            <Image
                              src={jar.image}
                              alt={jar.name}
                              width={56}
                              height={56}
                              className="object-contain w-full h-full max-h-[48px] filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
                            />
                          </div>
                          
                          {/* Mini Gold Foil Label */}
                          <span className="text-[8px] text-[#D4AF37] font-black uppercase tracking-wider border border-[#D4AF37]/35 bg-black/60 px-1 py-0.5 rounded leading-none">
                            {jar.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <span className="text-[7px] text-purple-300/40 font-bold uppercase tracking-[0.2em] text-center">100% Purity Guaranteed</span>
                </div>

                {/* LAYER 3: GOLD FOIL GREETING CARD (Slides bottom-left) */}
                <div className="absolute w-[180px] h-[110px] bg-gradient-to-br from-[#fffefc] to-[#fcfaf2] rounded-xl shadow-md border border-[#D4AF37]/35 p-3 flex flex-col justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-24 group-hover:translate-y-24 group-hover:scale-110 group-hover:-rotate-[5deg] group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] z-15">
                  <div className="flex justify-between items-start border-b border-[#D4AF37]/20 pb-1.5">
                    <span className="text-[8px] text-[#AA7C11] font-black uppercase tracking-wider">A Gift of Wellness</span>
                    <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                  </div>
                  <div className="my-auto text-left leading-normal">
                    <p className="text-[8px] text-[#1e0a2e]/90 font-medium italic">"Handcrafted natural goodness, curated especially for you."</p>
                  </div>
                  <div className="flex justify-between items-center text-[6px] text-[#1e0a2e]/50 font-bold tracking-widest uppercase">
                    <span>Kalindi Heritage</span>
                    <span>No. 425</span>
                  </div>
                </div>

                {/* LAYER 4: RIBBONED KEEPSAKE LID (Slides top-left and fades opacity slightly) */}
                <div className="absolute w-[240px] h-[240px] bg-gradient-to-br from-[#1d0e2e] via-[#0d0714] to-[#050208] rounded-[24px] border-2 border-[#D4AF37]/30 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-12 group-hover:-translate-y-28 group-hover:scale-95 group-hover:-rotate-[8deg] group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.65)] z-20 flex flex-col items-center justify-center">
                  {/* Lid Lining Inset */}
                  <div className="absolute inset-2.5 border border-[#D4AF37]/15 rounded-[18px] pointer-events-none" />

                  {/* Ribbon stripes */}
                  <div className="absolute w-full h-6 bg-gradient-to-r from-[#AA7C11] via-[#D4AF37]/60 to-[#AA7C11] top-1/2 -translate-y-1/2 opacity-70 pointer-events-none" />
                  <div className="absolute h-full w-6 bg-gradient-to-b from-[#AA7C11] via-[#D4AF37]/60 to-[#AA7C11] left-1/2 -translate-x-1/2 opacity-70 pointer-events-none" />

                  {/* Logo Center Stamp */}
                  <div className="text-center z-30 select-none">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#fdf5d6] to-[#AA7C11] flex items-center justify-center mx-auto mb-3 shadow-lg border border-[#fdf5d6]/50">
                      <Package className="w-6 h-6 text-[#160b24]" />
                    </div>
                    <Image
                      src="/kalindi.png"
                      alt="Kalindi"
                      width={130}
                      height={40}
                      className="h-8 w-auto object-contain mx-auto mb-1 brightness-0 invert"
                    />
                    <p className="text-[#D4AF37] text-[8px] tracking-[0.3em] uppercase font-bold">Royal Box</p>
                  </div>

                  {/* Pulse Hint */}
                  <div className="absolute bottom-4 flex items-center gap-1.5 text-purple-200/50 text-[9px] tracking-[0.2em] uppercase font-black animate-pulse z-30">
                    <span>Hover to Open</span>
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* Text inside transparent card */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="p-8 md:p-10 rounded-3xl border border-indigo-300/20 bg-[#f0f4ff]/25 backdrop-blur-sm text-left"
          >
            <span className="text-indigo-600 text-sm font-semibold tracking-widest uppercase mb-4 block">
              The Unboxing Experience
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-indigo-950">
              Packaging as{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-700 bg-clip-text text-transparent">
                Luxury
              </span>
            </h2>
            <p className="text-lg text-indigo-900/70 leading-relaxed mb-8 font-light">
              We believe the experience of receiving Kalindi should feel as special as the products themselves. From the moment you hold the box, you feel the difference.
            </p>

            <div className="space-y-5">
              {packagingFeatures.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex gap-4 text-left"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-indigo-950 font-semibold mb-1">{f.title}</h4>
                    <p className="text-indigo-900/70 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
