"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Mumbai",
    role: "Nutritionist",
    rating: 5,
    text: "I recommend Kalindi to all my clients. The quality and freshness of their almonds and cashews is unmatched. You can truly taste the difference compared to generic brands.",
    avatar: "PS",
  },
  {
    name: "Rahul Mehta",
    location: "Delhi",
    role: "Corporate Professional",
    rating: 5,
    text: "Ordered Kalindi Royal Gift Boxes for Diwali for my entire team of 80 people. The premium packaging and quality wowed everyone. Will definitely order again!",
    avatar: "RM",
  },
  {
    name: "Ananya Krishnan",
    location: "Bangalore",
    role: "Fitness Coach",
    rating: 5,
    text: "Finally a dry fruit brand that takes quality seriously. No oily residue, no artificial smell, just pure natural goodness. The makhana is extraordinary!",
    avatar: "AK",
  },
  {
    name: "Vikram Singh",
    location: "Jaipur",
    role: "Entrepreneur",
    rating: 5,
    text: "Been ordering from Kalindi for 2 years. Consistency in quality is what keeps me coming back. Their figs and dates are like nothing else I've tried in India.",
    avatar: "VS",
  },
  {
    name: "Sneha Patel",
    location: "Ahmedabad",
    role: "Home Baker",
    rating: 5,
    text: "The almonds and pistachios I get from Kalindi make my baked goods stand out. Fresh, plump, and perfectly flavored. My customers notice the difference!",
    avatar: "SP",
  },
  {
    name: "Kiran Nair",
    location: "Hyderabad",
    role: "Ayurvedic Doctor",
    rating: 5,
    text: "Kalindi's dates and figs are as close to medicinal grade as you can get commercially. I prescribe them to patients for iron deficiency and digestion issues.",
    avatar: "KN",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-32 px-6 z-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-500/5 blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-sky-600 text-sm font-semibold tracking-widest uppercase mb-4 block">
            Customer Love
          </span>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-sky-950">
            50,000+ Happy{" "}
            <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
              Customers
            </span>
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-6 h-6 fill-sky-500 text-sky-500" />
            ))}
            <span className="text-sky-900/80 ml-2 text-lg">4.9/5 average rating</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="relative p-7 rounded-3xl border border-sky-300/20 bg-sky-50/30 backdrop-blur-sm hover:border-sky-400/40 transition-all duration-300 text-left"
            >
              <Quote className="w-8 h-8 text-sky-500/20 mb-4" />
              <p className="text-sky-950/80 leading-relaxed mb-6 text-sm">{t.text}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sky-950 font-semibold text-sm">{t.name}</p>
                    <p className="text-sky-900/60 text-xs">{t.role} · {t.location}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="w-3 h-3 fill-sky-500 text-sky-500" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
