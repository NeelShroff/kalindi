"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Are all Kalindi products 100% natural?",
    a: "Yes, absolutely. Every Kalindi product is 100% natural with zero preservatives, zero artificial colors, and zero added flavors. What you see is exactly what nature gave us.",
  },
  {
    q: "How do you ensure freshness in delivery?",
    a: "We use temperature-controlled packaging and process orders in small batches to ensure maximum freshness. All products are vacuum-sealed and delivered within 3-5 business days.",
  },
  {
    q: "Do you offer bulk or corporate orders?",
    a: "Yes! We specialize in corporate gifting with MOQ of 50 boxes. We offer full brand customization, personalized notes, and competitive pricing. Contact us at corporate@kalindi.in",
  },
  {
    q: "What is your return and refund policy?",
    a: "We stand behind our quality 100%. If you're not satisfied for any reason, we offer a full refund within 7 days of delivery. Just reach out to our support team.",
  },
  {
    q: "Do you ship across India?",
    a: "Yes, we deliver Pan India! Standard delivery takes 3-5 business days. We offer free shipping on all orders above ₹499.",
  },
  {
    q: "Are your products FSSAI certified?",
    a: "Yes, Kalindi is fully FSSAI certified (License No: 11221999000425). All our products undergo rigorous quality testing at ISO-certified labs before reaching you.",
  },
  {
    q: "Can I get gift packaging for any product?",
    a: "Our premium gift packaging is available for all products. You can add a personalized message card, choose from 3 box designs, and we'll hand-pack it beautifully for your recipient.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-32 px-6 z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-slate-500/5 blur-[120px] pointer-events-none" />
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-slate-500 text-sm font-semibold tracking-widest uppercase mb-4 block">FAQ</span>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-slate-800">
            Got{" "}
            <span className="bg-gradient-to-r from-slate-500 to-slate-700 bg-clip-text text-transparent">
              Questions?
            </span>
          </h2>
          <p className="text-xl text-slate-600 font-light">Everything you need to know about Kalindi.</p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="border border-slate-200/50 rounded-2xl overflow-hidden hover:border-slate-400/40 transition-colors duration-300 bg-slate-50/20"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left bg-slate-50/40 hover:bg-slate-100/50 transition-colors"
              >
                <span className="text-slate-800 font-medium pr-4">{faq.q}</span>
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200/50 flex items-center justify-center">
                  {open === i ? (
                    <Minus className="w-4 h-4 text-slate-600" />
                  ) : (
                    <Plus className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <p className="px-6 pb-6 text-slate-600 leading-relaxed text-sm">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
