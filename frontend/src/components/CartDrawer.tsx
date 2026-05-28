"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag, Sparkles, CheckCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  
  // Checkout Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isCartOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Full Name is required";
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email address is invalid";
    }
    
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[0-9\s-]{10,14}$/.test(form.phone)) {
      newErrors.phone = "Phone number is invalid (must be 10-12 digits)";
    }
    
    if (!form.address.trim()) newErrors.address = "Shipping Address is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Prepare payload
    const orderItems = cartItems.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      weight: item.weight,
      price: item.price,
      quantity: item.quantity,
    }));
    
    const payload = {
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      shipping_address: form.address,
      total_amount: cartTotal + (cartTotal >= 499 ? 0 : 60), // Add shipping if total < ₹499
      items: orderItems,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088';
      const response = await fetch(`${apiUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      const orderData = await response.json();
      setOrderId(orderData.id);
      clearCart();
      setStep("success");
    } catch (err: any) {
      console.error(err);
      alert("Something went wrong while placing your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    // Reset steps after closing if finished
    if (step === "success") {
      setStep("cart");
      setForm({ name: "", email: "", phone: "", address: "" });
    }
  };

  // Shipping Calculations
  const shippingThreshold = 499;
  const shippingFee = 60;
  const isFreeShipping = cartTotal >= shippingThreshold;
  const progressToFreeShipping = Math.min((cartTotal / shippingThreshold) * 100, 100);
  const grandTotal = cartTotal + (isFreeShipping ? 0 : shippingFee);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
          className="w-screen max-w-md bg-[#0f0717]/95 border-l border-purple-500/20 backdrop-blur-2xl shadow-2xl flex flex-col text-white"
        >
          {/* Header */}
          <div className="p-6 border-b border-purple-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#e91e8c]" />
              <h2 className="text-xl font-bold tracking-wide">
                {step === "cart" && `Your Cart (${cartCount})`}
                {step === "checkout" && "Secure Checkout"}
                {step === "success" && "Order Confirmed!"}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Cart Items */}
            {step === "cart" && (
              <motion.div
                key="cart-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {cartItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-[#e91e8c]">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-white/90">Your cart is empty</h3>
                    <p className="text-sm text-white/50 mt-1 max-w-xs">
                      Browse our collection of handpicked luxury dry fruits and add premium products to your cart.
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#e91e8c] to-[#be185d] text-sm font-semibold hover:shadow-[0_0_15px_rgba(233,30,140,0.3)] transition-all"
                    >
                      Shop Now
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Free Shipping Progress */}
                    <div className="px-6 pt-4 pb-2 border-b border-purple-500/5 bg-purple-500/5">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>
                          {isFreeShipping ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> Free shipping unlocked!
                            </span>
                          ) : (
                            <span className="text-white/70">
                              Add <strong className="text-[#e91e8c]">₹{shippingThreshold - cartTotal}</strong> more for Free Shipping
                            </span>
                          )}
                        </span>
                        <span className="text-white/50">Threshold: ₹{shippingThreshold}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#e91e8c] to-purple-500 transition-all duration-300"
                          style={{ width: `${progressToFreeShipping}%` }}
                        />
                      </div>
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                      {cartItems.map((item) => (
                        <div
                          key={item.cart_item_id}
                          className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-purple-500/10 transition-colors"
                        >
                          {/* Image Placeholder with color gradient */}
                          <div className={`w-16 h-16 rounded-xl flex-shrink-0 bg-gradient-to-br ${item.color || "from-purple-900 to-indigo-950"} relative overflow-hidden flex items-center justify-center`}>
                            <span className="text-white/10 text-2xl font-black">K</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate text-white">{item.name}</h4>
                            <p className="text-xs text-white/50 mt-0.5">Weight: {item.weight}</p>
                            <p className="text-sm font-bold text-[#D4AF37] mt-1">₹{item.price}</p>
                          </div>

                          {/* Controls */}
                          <div className="flex flex-col items-end gap-3">
                            <button
                              onClick={() => removeFromCart(item.cart_item_id)}
                              className="text-white/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex items-center border border-white/10 rounded-full bg-white/5 p-0.5">
                              <button
                                onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Footer */}
                    <div className="p-6 border-t border-purple-500/10 bg-white/[0.01] space-y-4">
                      <div className="space-y-2 text-sm text-white/70">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="text-white font-medium">₹{cartTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span>{isFreeShipping ? <span className="text-emerald-400 font-medium">Free</span> : `₹${shippingFee}`}</span>
                        </div>
                        <div className="border-t border-white/5 pt-2 flex justify-between text-base font-bold text-white">
                          <span>Total Amount</span>
                          <span className="text-[#D4AF37]">₹{grandTotal}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setStep("checkout")}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#e91e8c] to-[#be185d] font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(233,30,140,0.4)] transition-all group"
                      >
                        Proceed to Checkout <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 2: Checkout Form */}
            {step === "checkout" && (
              <motion.div
                key="checkout-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <form onSubmit={handleCheckout} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                    {/* Return Link */}
                    <button
                      type="button"
                      onClick={() => setStep("cart")}
                      className="flex items-center gap-2 text-xs font-semibold text-[#e91e8c] hover:underline"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
                    </button>

                    <h3 className="text-lg font-bold text-white/95 border-b border-white/5 pb-2">Shipping Information</h3>

                    <div className="space-y-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/70 block">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.name ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#e91e8c]"} text-white placeholder:text-white/20 outline-none transition-colors`}
                          placeholder="e.g. Jiten Shroff"
                        />
                        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/70 block">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.email ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#e91e8c]"} text-white placeholder:text-white/20 outline-none transition-colors`}
                          placeholder="e.g. customer@example.com"
                        />
                        {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/70 block">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.phone ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#e91e8c]"} text-white placeholder:text-white/20 outline-none transition-colors`}
                          placeholder="e.g. 9876543210"
                        />
                        {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                      </div>

                      {/* Address */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/70 block">Shipping Address</label>
                        <textarea
                          name="address"
                          value={form.address}
                          onChange={handleInputChange}
                          rows={3}
                          className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.address ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#e91e8c]"} text-white placeholder:text-white/20 outline-none resize-none transition-colors`}
                          placeholder="Street Address, City, State, ZIP Code"
                        />
                        {errors.address && <p className="text-xs text-red-400">{errors.address}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Submit Footer */}
                  <div className="p-6 border-t border-purple-500/10 bg-white/[0.01] space-y-4">
                    <div className="flex justify-between text-base font-bold text-white">
                      <span>Grand Total</span>
                      <span className="text-[#D4AF37]">₹{grandTotal}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[#e91e8c] to-[#be185d] font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(233,30,140,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          Confirm & Place Order <CheckCircle className="w-5 h-5 text-white" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Success Confirmation */}
            {step === "success" && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400"
                >
                  <CheckCircle className="w-12 h-12" />
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-wide text-white">Order Placed!</h3>
                  <p className="text-[#D4AF37] font-semibold text-sm">Order ID: #{orderId}</p>
                  <p className="text-white/60 text-sm max-w-xs mx-auto mt-2">
                    A beautifully styled order confirmation receipt has been sent to <strong className="text-white">{form.email}</strong>.
                  </p>
                </div>

                <div className="w-full max-w-xs bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-left text-sm space-y-2 mt-4">
                  <p className="text-white/50">Shipment Details:</p>
                  <p className="font-bold text-white">{form.name}</p>
                  <p className="text-white/70 text-xs leading-relaxed">{form.address}</p>
                  <p className="text-white/70 text-xs">Ph: {form.phone}</p>
                </div>

                <button
                  onClick={handleClose}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-[#e91e8c] to-[#be185d] font-bold text-sm hover:shadow-[0_0_20px_rgba(233,30,140,0.3)] transition-all"
                >
                  Continue Shopping
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
