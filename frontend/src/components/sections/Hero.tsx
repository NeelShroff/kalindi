"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Hero() {
  const container = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { y: -80 },
        {
          y: 80,
          scrollTrigger: {
            trigger: container.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        }
      );
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={container}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32 px-6"
    >
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#e91e8c]/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#3d1a5c]/40 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e91e8c]/40 bg-[#e91e8c]/10 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-[#e91e8c]" />
          <span className="text-sm font-medium tracking-widest text-[#f472b6] uppercase">Premium Dry Fruits Since 2010</span>
        </motion.div>

        <motion.h1
          ref={headlineRef}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-6xl md:text-8xl lg:text-[7rem] font-bold tracking-tighter leading-none mb-6"
        >
          <span className="text-white">Nature&apos;s</span>
          <br />
          <span className="bg-gradient-to-r from-[#e91e8c] via-[#f472b6] to-[#3d1a5c] bg-clip-text text-transparent">
            Finest Luxury
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xl md:text-2xl text-[#f0eaf8]/60 max-w-2xl mb-14 font-light leading-relaxed"
        >
          Hand-selected premium dry fruits and wellness gifts, crafted for those who appreciate the extraordinary.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#products"
            className="group relative px-8 py-4 rounded-full font-semibold text-lg overflow-hidden bg-gradient-to-r from-[#e91e8c] to-[#be185d] text-white shadow-[0_0_40px_rgba(233,30,140,0.4)] hover:shadow-[0_0_60px_rgba(233,30,140,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            Shop Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#story"
            className="px-8 py-4 rounded-full font-medium text-lg text-white border border-white/20 hover:border-[#e91e8c]/50 hover:bg-[#e91e8c]/10 transition-all duration-300"
          >
            Our Story
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-24 grid grid-cols-3 gap-12 border-t border-white/10 pt-12 w-full max-w-2xl"
        >
          {[
            { value: "15+", label: "Years of Excellence" },
            { value: "50K+", label: "Happy Customers" },
            { value: "100%", label: "Natural & Pure" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-[#e91e8c] to-[#f472b6] bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-sm text-white/40 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
