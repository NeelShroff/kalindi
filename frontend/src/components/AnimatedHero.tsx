"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import "./hero.css"; // We'll add some specific CSS here if needed, or just use inline styles

export default function AnimatedHero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100 },
    },
  };

  return (
    <section className="hero-section">
      <div className="hero-background">
        <motion.div
          className="glow-orb orb-1"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="glow-orb orb-2"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="container hero-content">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hero-text-container"
        >
          <motion.div variants={itemVariants} className="badge">
            <Sparkles size={16} className="badge-icon" />
            <span>Framer Motion Next.js Template</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="hero-title">
            Build <span className="text-gradient">Stunning</span> <br />
            Animated Experiences
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-subtitle">
            Create buttery smooth, production-ready animations with minimal code.
            Experience the future of interactive web design today.
          </motion.p>

          <motion.div variants={itemVariants} className="hero-actions">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary"
            >
              Get Started <ArrowRight size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-secondary glass-panel"
            >
              View Documentation
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
