"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag, Sparkles, CheckCircle, Lock, CreditCard, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getFallbackImage } from "@/lib/utils";

const parseStoredAddress = (addressStr: string) => {
  if (!addressStr) return { street: "", city: "", state: "", pincode: "" };
  
  const pinMatch = addressStr.match(/(?:-\s*)?(\d{6})$/);
  if (pinMatch) {
    const pincode = pinMatch[1];
    const mainPart = addressStr.substring(0, pinMatch.index).replace(/,\s*-\s*$/, '').trim();
    const parts = mainPart.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const state = parts.pop() || "";
      const city = parts.pop() || "";
      const street = parts.join(', ');
      return { street, city, state, pincode };
    }
  }
  return { street: addressStr, city: "", state: "", pincode: "" };
};

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
  
  const { user, updateUser, openLoginModal } = useAuth();

  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  
  // Checkout Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Structured Address States
  const [streetAddress, setStreetAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isPincodeValidating, setIsPincodeValidating] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [isPincodeValid, setIsPincodeValid] = useState(false);
  const [addressValidationError, setAddressValidationError] = useState("");

  // Coupon Code State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isManuallyRemoved, setIsManuallyRemoved] = useState(false);

  // Auto-apply FIRST7 for first order if subtotal >= 1500
  React.useEffect(() => {
    const autoApply = async () => {
      // If already applied, or manually removed, or subtotal is less than 1500, do nothing
      if (appliedCoupon || cartTotal < 1500 || isManuallyRemoved) {
        return;
      }

      // If user is logged in, we check if they are eligible
      if (user && user.email) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088';
          const res = await fetch(`${apiUrl}/api/orders/last?email=${encodeURIComponent(user.email)}`);
          if (res.ok) {
            const lastOrder = await res.json();
            // If they have previous orders in progress or completed, they are NOT eligible
            if (["processing", "shipped", "completed"].includes(lastOrder.status)) {
              return;
            }
          }
        } catch (err) {
          console.error("Error checking eligibility for auto-apply:", err);
        }
      }

      // Apply the coupon
      setAppliedCoupon("FIRST7");
      setCouponSuccess(user ? "Promo code FIRST7 applied automatically!" : "Promo code FIRST7 applied automatically! (Will be verified at checkout)");
      setCouponError(null);
    };

    autoApply();
  }, [cartTotal, user, appliedCoupon, isManuallyRemoved]);

  // Reset manually removed state when cartTotal changes (e.g. user adds/removes items)
  React.useEffect(() => {
    setIsManuallyRemoved(false);
  }, [cartTotal]);

  // Auto-fill checkout fields if user profile is loaded
  React.useEffect(() => {
    if (step === "checkout" && user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: prev.phone || user.phone || "",
        address: prev.address || user.address || "",
      }));
    }
  }, [step, user]);

  // Sync structured address states when form.address changes
  React.useEffect(() => {
    if (step === "checkout") {
      const addressToParse = form.address || "";
      if (addressToParse) {
        const parsed = parseStoredAddress(addressToParse);
        setStreetAddress(parsed.street);
        setPincode(parsed.pincode);
        setCity(parsed.city);
        setState(parsed.state);
        if (parsed.pincode && parsed.pincode.length === 6) {
          setIsPincodeValid(true);
          setPincodeError("");
        }
      }
    }
  }, [step, form.address]);

  const handlePincodeInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);
    setIsPincodeValid(false);
    
    if (errors.pincode) {
      setErrors(prev => ({ ...prev, pincode: "" }));
    }

    if (val.length === 6) {
      setIsPincodeValidating(true);
      setPincodeError("");
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffice = data[0].PostOffice[0];
            setCity(postOffice.District || postOffice.Block || "");
            setState(postOffice.State || "");
            setIsPincodeValid(true);
            setPincodeError("");
          } else {
            setPincodeError("Invalid Indian PIN code. Please enter a valid 6-digit code.");
            setErrors(prev => ({ ...prev, pincode: "Invalid Indian PIN code." }));
          }
        } else {
          setPincodeError("Could not verify PIN code. Please check and try again.");
          setErrors(prev => ({ ...prev, pincode: "Could not verify PIN code." }));
        }
      } catch (err) {
        console.error("PIN Code validation error:", err);
        // Fallback: allow manual entry if API is offline
        setPincodeError("");
        setIsPincodeValid(true);
      } finally {
        setIsPincodeValidating(false);
      }
    } else {
      setCity("");
      setState("");
    }
  };

  // Validate coupon automatically if user logs in after applying it
  React.useEffect(() => {
    const validateCouponOnLogin = async () => {
      if (appliedCoupon === "FIRST7" && user && user.email) {
        setIsValidatingCoupon(true);
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088';
          const res = await fetch(`${apiUrl}/api/orders/last?email=${encodeURIComponent(user.email)}`);
          if (res.ok) {
            const lastOrder = await res.json();
            if (["processing", "shipped", "completed"].includes(lastOrder.status)) {
              setAppliedCoupon(null);
              setCouponError("FIRST7 is only valid for your first order.");
              setCouponSuccess(null);
            } else {
              setCouponSuccess("Promo code FIRST7 applied successfully!");
              setCouponError(null);
            }
          } else if (res.status === 404) {
            setCouponSuccess("Promo code FIRST7 applied successfully!");
            setCouponError(null);
          }
        } catch (err) {
          console.error("Error validating coupon eligibility:", err);
        } finally {
          setIsValidatingCoupon(false);
        }
      }
    };
    validateCouponOnLogin();
  }, [user, appliedCoupon]);

  // Remove coupon if subtotal falls below ₹1,500
  React.useEffect(() => {
    if (appliedCoupon === "FIRST7" && cartTotal < 1500) {
      setAppliedCoupon(null);
      setCouponSuccess(null);
      setCouponError("Coupon FIRST7 removed. Minimum order value of ₹1,500 required.");
    }
  }, [cartTotal, appliedCoupon]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    if (code !== "FIRST7") {
      setCouponError("Invalid coupon code.");
      return;
    }

    if (cartTotal < 1500) {
      setCouponError("Minimum order value of ₹1,500 required for FIRST7.");
      return;
    }

    if (user && user.email) {
      setIsValidatingCoupon(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088';
        const res = await fetch(`${apiUrl}/api/orders/last?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const lastOrder = await res.json();
          if (["processing", "shipped", "completed"].includes(lastOrder.status)) {
            setCouponError("FIRST7 is only valid for your first order.");
            setIsValidatingCoupon(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error validating coupon eligibility:", err);
      } finally {
        setIsValidatingCoupon(false);
      }
    }

    setAppliedCoupon(code);
    setCouponSuccess(user ? "Promo code FIRST7 applied successfully!" : "Promo code FIRST7 applied! (Will be verified at checkout)");
  };

  // Prevent body scrolling when Cart is open
  React.useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

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
    
    if (!streetAddress.trim()) {
      newErrors.streetAddress = "Street Address is required";
    }
    if (!pincode.trim()) {
      newErrors.pincode = "PIN Code is required";
    } else if (pincode.length !== 6 || !isPincodeValid) {
      newErrors.pincode = pincodeError || "Valid 6-digit PIN Code is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setAddressValidationError("");
    
    const shippingAddress = `${streetAddress.trim()}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}`;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088';

    // AI-Powered Address Validation
    try {
      const valRes = await fetch(`${apiUrl}/api/orders/validate-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: shippingAddress }),
      });

      if (valRes.ok) {
        const valData = await valRes.json();
        if (!valData.is_valid) {
          const missingMsg = valData.missing_parts.join(", ");
          setAddressValidationError(
            `Address incomplete. Missing details: ${missingMsg}. Please specify flat/house number and building details.`
          );
          setIsSubmitting(false);
          return;
        }
        // If valid, use the suggested address layout if available
        if (valData.suggested_address) {
          const parsed = parseStoredAddress(valData.suggested_address);
          if (parsed.street) setStreetAddress(parsed.street);
          if (parsed.city) setCity(parsed.city);
          if (parsed.state) setState(parsed.state);
        }
      }
    } catch (err) {
      console.error("Address validation failed, falling back to client-side validation:", err);
    }
    
    // Update local form state for consistency across callbacks
    setForm((prev) => ({ ...prev, address: shippingAddress }));
    
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
      shipping_address: shippingAddress,
      total_amount: grandTotal,
      discount_code: appliedCoupon,
      payment_method: paymentMethod,
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to place order");
      }

      const orderData = await response.json();
      
      // Direct success for Cash on Delivery (COD) orders
      if (paymentMethod === "cod") {
        setOrderId(orderData.id);
        clearCart();
        setStep("success");
        if (user) {
          updateUser({
            ...user,
            phone: form.phone,
            address: shippingAddress
          });
        }
        setIsSubmitting(false);
        return;
      }
      
      // Auto-simulate mock payment if in demo/local mode without credentials
      if (orderData.razorpay_order_id.startsWith("order_mock_")) {
        setTimeout(async () => {
          try {
            const verifyResponse = await fetch(`${apiUrl}/api/orders/${orderData.id}/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: orderData.razorpay_order_id,
                razorpay_payment_id: "pay_mock_" + Math.random().toString(36).substring(2, 15),
                razorpay_signature: "sig_mock_" + Math.random().toString(36).substring(2, 15),
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed");
            }

            const verifiedOrder = await verifyResponse.json();
            setOrderId(verifiedOrder.id);
            clearCart();
            setStep("success");
            if (user) {
              updateUser({
                ...user,
                phone: form.phone,
                address: shippingAddress
              });
            }
          } catch (verifyErr) {
            console.error(verifyErr);
            alert("Sandbox payment verification failed. Please try again.");
          } finally {
            setIsSubmitting(false);
          }
        }, 1000);
        return;
      }
      
      // Live Razorpay Mode
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load Razorpay SDK. Please check your network connection.");
        setIsSubmitting(false);
        return;
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key";

      const options = {
        key: razorpayKey,
        amount: Math.round(orderData.total_amount * 100), // Server-calculated amount in paise — never use local payload
        currency: "INR",
        name: "Kalindi Dry Fruits",
        description: "Premium Wellness Goods",
        image: "/kalindi.webp",
        order_id: orderData.razorpay_order_id,
        handler: async function (paymentResponse: any) {
          setIsSubmitting(true);
          try {
            const verifyResponse = await fetch(`${apiUrl}/api/orders/${orderData.id}/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed");
            }

            const verifiedOrder = await verifyResponse.json();
            setOrderId(verifiedOrder.id);
            clearCart();
            setStep("success");
            if (user) {
              updateUser({
                ...user,
                phone: form.phone,
                address: shippingAddress
              });
            }
          } catch (verifyErr) {
            console.error(verifyErr);
            alert("Payment verification failed. Please contact customer support.");
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          address: shippingAddress,
        },
        theme: {
          color: "#3D1A5C",
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong while placing your order. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    // Reset steps after closing if finished
    if (step === "success") {
      setStep("cart");
      setForm({ name: "", email: "", phone: "", address: "" });
      setStreetAddress("");
      setPincode("");
      setCity("");
      setState("");
      setIsPincodeValid(false);
      setPincodeError("");
      setAddressValidationError("");
    }
  };

  // Calculate total weight of cart items in kg
  const totalWeightKg = cartItems.reduce((total, item) => {
    let itemWeight = 0;
    if (item.weight === "250g") {
      itemWeight = 0.25;
    } else if (item.weight === "500g") {
      itemWeight = 0.5;
    } else if (["1000g", "1kg", "1 kg", "1000 g"].includes(item.weight)) {
      itemWeight = 1.0;
    }
    return total + (itemWeight * item.quantity);
  }, 0);

  // Shipping Calculations
  const shippingThreshold = 2000;
  
  // Calculate weight-based shipping fee
  let baseShippingFee = 50;
  if (totalWeightKg <= 1.0) {
    baseShippingFee = 50;
  } else if (totalWeightKg <= 2.0) {
    baseShippingFee = 120;
  } else if (totalWeightKg <= 3.0) {
    baseShippingFee = 150;
  } else {
    baseShippingFee = 180;
  }

  const discountAmount = appliedCoupon === "FIRST7" ? Math.round(cartTotal * 0.07 * 100) / 100 : 0;
  const discountedSubtotal = cartTotal - discountAmount;
  const isFreeShipping = discountedSubtotal >= shippingThreshold;
  const progressToFreeShipping = Math.min((discountedSubtotal / shippingThreshold) * 100, 100);
  const shippingFee = isFreeShipping ? 0 : baseShippingFee;
  const grandTotal = discountedSubtotal + shippingFee;

  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex sm:pl-10">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
          className="w-full sm:w-screen max-w-md bg-[#0f0717]/95 border-l border-purple-500/20 backdrop-blur-2xl shadow-2xl flex flex-col text-white"
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
                               Add <strong className="text-[#e91e8c]">₹{Math.max(0, shippingThreshold - discountedSubtotal)}</strong> more for Free Shipping
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
                          {/* Product Image */}
                          <div className="w-16 h-16 rounded-xl flex-shrink-0 relative overflow-hidden bg-white/5 flex items-center justify-center border border-white/5">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null; // Prevent infinite loops
                                  e.currentTarget.src = getFallbackImage(item.name);
                                }}
                              />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${item.color || "from-purple-900 to-indigo-950"} flex items-center justify-center`}>
                                <span className="text-white/10 text-2xl font-black">K</span>
                              </div>
                            )}
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
                      {/* Promo Code Input */}
                      <div className="border-b border-purple-500/10 pb-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-white/60">Promo Code</label>
                          {appliedCoupon && (
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedCoupon(null);
                                setCouponCode("");
                                setCouponSuccess(null);
                                setCouponError(null);
                                setIsManuallyRemoved(true);
                              }}
                              className="text-[10px] font-bold text-[#e91e8c] hover:underline"
                            >
                              Remove Code
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter promo code (e.g. FIRST7)"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value);
                              setCouponError(null);
                            }}
                            disabled={appliedCoupon !== null || isValidatingCoupon}
                            className={`flex-1 px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder:text-white/20 outline-none transition-all ${
                              appliedCoupon 
                                ? "border-emerald-500/30 text-emerald-400 font-semibold cursor-not-allowed bg-emerald-500/5"
                                : "border-white/10 focus:border-purple-500"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={appliedCoupon !== null || isValidatingCoupon || !couponCode.trim()}
                            className="px-4 py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/30 text-xs font-bold text-white hover:bg-purple-600/50 hover:border-purple-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {isValidatingCoupon ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[11px] font-medium text-red-400 pl-1">{couponError}</p>
                        )}
                        {couponSuccess && (
                          <p className="text-[11px] font-medium text-emerald-400 pl-1">{couponSuccess}</p>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-white/70">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="text-white font-medium">₹{cartTotal}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-emerald-400">
                            <span>Discount (7% off)</span>
                            <span>-₹{discountAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs text-white/50 border-t border-white/5 pt-1.5">
                          <span>Total Weight</span>
                          <span>{totalWeightKg.toFixed(2)} kg</span>
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
                        onClick={() => {
                          if (!user) {
                            // Close cart, prompt login, then reopen cart at checkout step
                            setIsCartOpen(false);
                            openLoginModal(() => {
                              setIsCartOpen(true);
                              setStep("checkout");
                            });
                          } else {
                            setStep("checkout");
                          }
                        }}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#e91e8c] to-[#be185d] font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(233,30,140,0.4)] transition-all group"
                      >
                        {user ? (
                          <>
                            Proceed to Checkout <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" /> Sign In to Checkout
                          </>
                        )}
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
                         <div className="relative">
                           <input
                             type="text"
                             name="name"
                             value={form.name}
                             onChange={handleInputChange}
                             readOnly={!!user}
                             className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.name ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#e91e8c]"} text-white placeholder:text-white/20 outline-none transition-colors ${
                               user ? "opacity-75 cursor-not-allowed bg-white/0 border-dashed border-purple-500/30 pr-10" : ""
                             }`}
                             placeholder="e.g. Jiten Shroff"
                           />
                           {user && (
                             <Lock className="w-4 h-4 text-purple-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                           )}
                         </div>
                         {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                       </div>
 
                       {/* Email */}
                       <div className="space-y-1">
                         <label className="text-xs font-semibold text-white/70 block">Email Address</label>
                         <div className="relative">
                           <input
                             type="email"
                             name="email"
                             value={form.email}
                             onChange={handleInputChange}
                             readOnly={!!user}
                             className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.email ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#e91e8c]"} text-white placeholder:text-white/20 outline-none transition-colors ${
                               user ? "opacity-75 cursor-not-allowed bg-white/0 border-dashed border-purple-500/30 pr-10" : ""
                             }`}
                             placeholder="e.g. customer@example.com"
                           />
                           {user && (
                             <Lock className="w-4 h-4 text-purple-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                           )}
                         </div>
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

                      {/* Structured Shipping Address */}
                      <div className="space-y-4">
                        {/* Street Address */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-white/70 block">Street Address</label>
                          <textarea
                            value={streetAddress}
                            onChange={(e) => {
                              setStreetAddress(e.target.value);
                              if (errors.streetAddress) {
                                setErrors(prev => ({ ...prev, streetAddress: "" }));
                              }
                              if (addressValidationError) {
                                setAddressValidationError("");
                              }
                            }}
                            rows={2}
                            className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.streetAddress ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#e91e8c]"} text-white placeholder:text-white/20 outline-none resize-none transition-colors`}
                            placeholder="Flat/House No, Building Name, Area, Street"
                          />
                          {errors.streetAddress && <p className="text-xs text-red-400">{errors.streetAddress}</p>}
                          {addressValidationError && <p className="text-xs text-red-400 mt-1.5 font-semibold leading-relaxed">{addressValidationError}</p>}
                        </div>

                        {/* PIN Code */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-white/70 block">PIN Code</label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={6}
                              value={pincode}
                              onChange={handlePincodeInputChange}
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                                errors.pincode ? "border-red-500 focus:border-red-500" : isPincodeValid ? "border-emerald-500 focus:border-emerald-500" : "border-white/10 focus:border-[#e91e8c]"
                              } text-white placeholder:text-white/20 outline-none transition-colors pr-10`}
                              placeholder="e.g. 400101"
                            />
                            {isPincodeValidating && (
                              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
                              </div>
                            )}
                            {!isPincodeValidating && isPincodeValid && (
                              <CheckCircle className="w-5 h-5 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2 transition-all duration-200" />
                            )}
                          </div>
                          {errors.pincode && <p className="text-xs text-red-400">{errors.pincode}</p>}
                        </div>

                        {/* City & State (Disabled/Read-only style but auto-filled) */}
                        {isPincodeValid && (
                          <div className="grid grid-cols-2 gap-3 transition-all duration-300 ease-out">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-white/50 block uppercase tracking-wider">City</label>
                              <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                readOnly={isPincodeValid && !!city && !pincodeError}
                                className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 outline-none ${
                                  isPincodeValid && !!city && !pincodeError ? "opacity-75 cursor-not-allowed bg-white/[0.02] border-white/5" : "focus:border-[#e91e8c]"
                                }`}
                                placeholder="City"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-white/50 block uppercase tracking-wider">State</label>
                              <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                readOnly={isPincodeValid && !!state && !pincodeError}
                                className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 outline-none ${
                                  isPincodeValid && !!state && !pincodeError ? "opacity-75 cursor-not-allowed bg-white/[0.02] border-white/5" : "focus:border-[#e91e8c]"
                                }`}
                                placeholder="State"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Payment Method Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-white/70 block">Payment Method</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("online")}
                            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all hover:bg-white/[0.04] ${
                              paymentMethod === "online"
                                ? "border-[#e91e8c] bg-[#e91e8c]/5 shadow-[0_0_15px_rgba(233,30,140,0.15)] text-white"
                                : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-white">Pay Online</span>
                              <CreditCard className={`w-4 h-4 ${paymentMethod === "online" ? "text-[#e91e8c]" : "text-white/40"}`} />
                            </div>
                            <span className="text-[10px] text-white/40 leading-snug">UPI, Card, NetBanking (via Razorpay)</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("cod")}
                            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all hover:bg-white/[0.04] ${
                              paymentMethod === "cod"
                                ? "border-[#e91e8c] bg-[#e91e8c]/5 shadow-[0_0_15px_rgba(233,30,140,0.15)] text-white"
                                : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-white">Cash on Delivery</span>
                              <Truck className={`w-4 h-4 ${paymentMethod === "cod" ? "text-[#e91e8c]" : "text-white/40"}`} />
                            </div>
                            <span className="text-[10px] text-white/40 leading-snug">Pay via Cash / UPI at your doorstep</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Footer */}
                  <div className="p-6 border-t border-purple-500/10 bg-white/[0.01] space-y-4">
                    <div className="space-y-2 text-sm text-white/70">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="text-white font-medium">₹{cartTotal}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Discount (7% off)</span>
                          <span>-₹{discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs text-white/50 border-t border-white/5 pt-1.5">
                        <span>Total Weight</span>
                        <span>{totalWeightKg.toFixed(2)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{isFreeShipping ? <span className="text-emerald-400 font-medium">Free</span> : `₹${shippingFee}`}</span>
                      </div>
                      <div className="border-t border-white/5 pt-2 flex justify-between text-base font-bold text-white">
                        <span>Grand Total</span>
                        <span className="text-[#D4AF37]">₹{grandTotal}</span>
                      </div>
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
