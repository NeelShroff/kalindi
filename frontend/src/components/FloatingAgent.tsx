"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

export default function FloatingAgent() {
  const router = useRouter();
  const pathname = usePathname();

  // Bounded viewport drag constraints state for the floating button
  const [dragConstraints, setDragConstraints] = useState({ left: -600, right: 0, top: -600, bottom: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setDragConstraints({
          left: -window.innerWidth + 80,
          right: 0,
          top: -window.innerHeight + 80,
          bottom: 0,
        });
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Hide the floating trigger jewel if we are already on the dedicated assistance page
  if (pathname === "/assistance") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none block">
      <motion.button
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.15}
        dragMomentum={true}
        onClick={() => router.push("/assistance")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border border-amber-500/30 bg-kalindi-purple overflow-hidden cursor-grab active:cursor-grabbing hover:border-amber-400"
        title="Open Luxury Concierge Assistance"
      >
        <img
          src="/guest_services_icon.png"
          alt="Guest Assist"
          className="w-full h-full object-cover rounded-full select-none pointer-events-none"
        />
      </motion.button>
    </div>
  );
}
