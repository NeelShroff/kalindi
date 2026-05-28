"use client";

import { motion } from "framer-motion";
import { Zap, Layers, Cpu } from "lucide-react";
import "./features.css";

const features = [
  {
    icon: <Zap size={32} />,
    title: "Lightning Fast",
    description: "Optimized for performance with Next.js Server Components and minimal client-side Javascript.",
  },
  {
    icon: <Layers size={32} />,
    title: "Smooth Animations",
    description: "Leverage the power of Framer Motion for buttery-smooth 60fps animations across all devices.",
  },
  {
    icon: <Cpu size={32} />,
    title: "Modern Stack",
    description: "Built on top of Next.js App Router, React 19, and the latest web standards.",
  },
];

export default function FeatureSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 80, damping: 15 },
    },
  };

  return (
    <section className="features-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="features-header"
        >
          <h2 className="section-title">Why choose our stack?</h2>
          <p className="section-subtitle">Everything you need to build incredible user interfaces.</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="features-grid"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -10, transition: { type: "spring" as const, stiffness: 300 } }}
              className="feature-card glass-panel"
            >
              <div className="feature-icon-wrapper">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
