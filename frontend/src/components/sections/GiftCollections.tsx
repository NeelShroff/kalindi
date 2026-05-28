"use client";

import { motion } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

const gifts = [
  {
    name: "The Classic Box",
    subtitle: "Perfect for any occasion",
    price: "₹999",
    items: ["Almonds 200g", "Cashews 200g", "Pistachios 100g", "Raisins 100g"],
    badge: "Most Gifted",
    gradient: "from-purple-300/40 to-fuchsia-300/20",
    accent: "#8b5cf6",
  },
  {
    name: "The Royal Box",
    subtitle: "For those who deserve the best",
    price: "₹1,999",
    items: ["Premium Almonds 500g", "W180 Cashews 300g", "Afghani Pistachios 200g", "Medjool Dates 200g", "Saffron 2g"],
    badge: "Luxury Pick",
    gradient: "from-fuchsia-400/40 to-purple-400/20",
    accent: "#d946ef",
  },
  {
    name: "Corporate Gifting",
    subtitle: "Bulk orders with brand customization",
    price: "Custom",
    items: ["Custom branding", "MOQ 50 boxes", "Personalized notes", "Pan India delivery"],
    badge: "For Business",
    gradient: "from-indigo-300/40 to-purple-300/20",
    accent: "#6366f1",
  },
];

export default function GiftCollections() {
  const { addToCart } = useCart();

  const handleOrderClick = (gift: typeof gifts[0], index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (gift.price === "Custom") {
      // Scroll to contact form
      const element = document.getElementById("contact");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    const priceVal = parseFloat(gift.price.replace("₹", "").replace(",", ""));
    const cartProduct = {
      id: 1000 + index, // Distinct namespace for mock/gift packages
      name: gift.name,
      image_url: null,
      color: "from-purple-600 to-fuchsia-600"
    };

    addToCart(cartProduct, "Assorted Box", priceVal);
  };

  return (
    <section id="gifts" className="relative py-32 px-6 z-10">
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-purple-600 text-sm font-semibold tracking-widest uppercase mb-4 block">
            Gift Collections
          </span>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-purple-950">
            Gifts That{" "}
            <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              Wow
            </span>
          </h2>
          <p className="text-xl text-purple-900/70 max-w-2xl mx-auto font-light">
            Beautifully packaged luxury dry fruit boxes for birthdays, festivals, weddings, and every moment worth celebrating.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {gifts.map((gift, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              whileHover={{ y: -10 }}
              className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${gift.gradient} p-px cursor-pointer group`}
              onClick={(e) => handleOrderClick(gift, i, e)}
            >
              <div className="rounded-3xl bg-[#fae8ff]/25 backdrop-blur-sm border border-purple-300/20 p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block" style={{ backgroundColor: gift.accent + "20", color: gift.accent }}>
                        {gift.badge}
                      </span>
                      <h3 className="text-2xl font-bold text-purple-950">{gift.name}</h3>
                      <p className="text-purple-900/70 text-sm mt-1">{gift.subtitle}</p>
                    </div>
                    <Gift className="w-8 h-8 mt-1" style={{ color: gift.accent }} />
                  </div>

                  <ul className="space-y-3 mb-8">
                    {gift.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-3 text-purple-950/80 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: gift.accent }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-purple-950">{gift.price}</p>
                  <button
                    onClick={(e) => handleOrderClick(gift, i, e)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 group-hover:gap-3"
                    style={{ backgroundColor: gift.accent + "15", color: gift.accent }}
                  >
                    {gift.price === "Custom" ? "Inquire Now" : "Order Now"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
