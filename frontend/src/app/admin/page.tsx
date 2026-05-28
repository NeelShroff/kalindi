"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  KeyRound, User, Lock, LayoutDashboard, ShoppingBag, 
  Settings, LogOut, Plus, Trash2, Edit, Check, X, 
  Upload, Sparkles, TrendingUp, DollarSign, ClipboardList,
  Eye, EyeOff, AlertCircle, RefreshCw
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price_250g: number | null;
  price_500g: number | null;
  price_1000g: number | null;
  image_url: string | null;
  tag: string | null;
  color: string | null;
  rating: number;
  reviews: number;
}

interface OrderItem {
  id: number;
  product_name: string;
  weight: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders">("dashboard");
  
  // Login states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Product Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price_250g: "",
    price_500g: "",
    price_1000g: "",
    image_url: "",
    tag: "",
    color: "from-[#D2B48C] to-[#8B6914]",
    rating: "4.8",
    reviews: "150"
  });

  // Verify token on load
  useEffect(() => {
    const storedToken = localStorage.getItem("kalindi_admin_token");
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch admin data once logged in
  useEffect(() => {
    if (isLoggedIn && token) {
      fetchData();
    }
  }, [isLoggedIn, token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Products
      const productsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}/api/products`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      // Fetch Orders
      const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}/api/orders`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      } else if (ordersRes.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both credentials");
      return;
    }
    
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem("kalindi_admin_token", data.access_token);
      setToken(data.access_token);
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || "Connection refused. Is backend running?");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kalindi_admin_token");
    setToken(null);
    setIsLoggedIn(false);
    setActiveTab("dashboard");
  };

  // Image upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImageFile(file);
    
    // Auto upload image immediately
    const formData = new FormData();
    formData.append("file", file);
    
    setUploadProgress(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}/api/uploads`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error("Image upload failed");
      
      const resData = await response.json();
      setProductForm(prev => ({ ...prev, image_url: resData.image_url }));
    } catch (error) {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadProgress(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert("Product Name is required");
      return;
    }

    // Convert inputs
    const payload = {
      name: productForm.name,
      description: productForm.description || null,
      price_250g: productForm.price_250g ? parseFloat(productForm.price_250g) : null,
      price_500g: productForm.price_500g ? parseFloat(productForm.price_500g) : null,
      price_1000g: productForm.price_1000g ? parseFloat(productForm.price_1000g) : null,
      image_url: productForm.image_url || null,
      tag: productForm.tag || null,
      color: productForm.color || null,
      rating: parseFloat(productForm.rating) || 4.8,
      reviews: parseInt(productForm.reviews) || 150,
      is_active: true
    };

    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}/api/products`;
      let method = "POST";

      if (formMode === "edit" && selectedProductId) {
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}/api/products/${selectedProductId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to save product");

      setIsFormOpen(false);
      resetProductForm();
      fetchData();
    } catch (err) {
      alert("Error saving product: " + err);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price_250g: "",
      price_500g: "",
      price_1000g: "",
      image_url: "",
      tag: "",
      color: "from-[#D2B48C] to-[#8B6914]",
      rating: "4.8",
      reviews: "150"
    });
    setImageFile(null);
    setSelectedProductId(null);
  };

  const handleEditProductClick = (product: Product) => {
    setFormMode("edit");
    setSelectedProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price_250g: product.price_250g ? product.price_250g.toString() : "",
      price_500g: product.price_500g ? product.price_500g.toString() : "",
      price_1000g: product.price_1000g ? product.price_1000g.toString() : "",
      image_url: product.image_url || "",
      tag: product.tag || "",
      color: product.color || "from-[#D2B48C] to-[#8B6914]",
      rating: product.rating.toString(),
      reviews: product.reviews.toString()
    });
    setIsFormOpen(true);
  };

  const handleDeleteProductClick = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to delete product");
      fetchData();
    } catch (err) {
      alert("Error deleting product: " + err);
    }
  };

  const handleOrderStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Failed to update status");
      fetchData();
    } catch (err) {
      alert("Error updating order: " + err);
    }
  };

  // Dashboard Stats
  const totalSales = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total_amount, 0);
  
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* 1. Login State Cover */}
      {!isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#e91e8c]/5 blur-[120px] rounded-full pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white shadow-sm border border-gray-200 border border-purple-100 backdrop-blur-2xl rounded-[32px] p-8 shadow-2xl relative"
          >
            {/* Branding Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black tracking-widest bg-gradient-to-r from-purple-400 to-[#e91e8c] bg-clip-text text-transparent">
                KALINDI
              </h1>
              <p className="text-xs text-gray-900/50 tracking-wider uppercase font-semibold mt-1">Admin Portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {loginError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900/70 block">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-900/35">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-900/20 outline-none focus:border-[#e91e8c] transition-colors text-sm"
                    placeholder="Enter admin username"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900/70 block">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-900/35">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-900/20 outline-none focus:border-[#e91e8c] transition-colors text-sm"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-900/35 hover:text-gray-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-[#e91e8c] text-gray-900 font-bold hover:shadow-[0_0_20px_rgba(233,30,140,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm mt-8"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Logging in...
                  </>
                ) : (
                  <>
                    Access Dashboard <KeyRound className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        /* 2. Admin Dashboard Layout */
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="w-full md:w-64 bg-white border-r border-purple-100 flex flex-col justify-between p-6">
            <div className="space-y-8">
              {/* Branding */}
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-[#e91e8c] flex items-center justify-center font-black">K</span>
                <div>
                  <h2 className="font-black text-sm tracking-widest text-gray-900 leading-none">KALINDI</h2>
                  <span className="text-[9px] text-[#e91e8c] font-bold uppercase tracking-widest">Portal</span>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1.5">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${
                    activeTab === "dashboard"
                      ? "bg-purple-600 text-gray-900 shadow-lg shadow-purple-600/25"
                      : "text-gray-900/50 hover:text-gray-900 hover:bg-white border-gray-300"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Overview
                </button>

                <button
                  onClick={() => setActiveTab("products")}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${
                    activeTab === "products"
                      ? "bg-purple-600 text-gray-900 shadow-lg shadow-purple-600/25"
                      : "text-gray-900/50 hover:text-gray-900 hover:bg-white border-gray-300"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Products
                </button>

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${
                    activeTab === "orders"
                      ? "bg-purple-600 text-gray-900 shadow-lg shadow-purple-600/25"
                      : "text-gray-900/50 hover:text-gray-900 hover:bg-white border-gray-300"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" /> Orders
                  {pendingOrders > 0 && (
                    <span className="ml-auto bg-amber-500 text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                      {pendingOrders}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all mt-8"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </aside>

          {/* Content Area */}
          <section className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
            {/* Upper Action Bar */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
              <div>
                <h1 className="text-2xl font-black capitalize tracking-wide">{activeTab}</h1>
                <p className="text-xs text-gray-900/40 mt-1">Manage product list, orders, and sales performance stats.</p>
              </div>

              <button
                onClick={fetchData}
                disabled={isLoading}
                className="p-2 rounded-xl bg-white border-gray-300 hover:bg-gray-100 text-gray-900/70 hover:text-gray-900 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* 2.1 Tab: Dashboard Overview */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Stats cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Card: Total Sales */}
                  <div className="bg-white shadow-sm border border-gray-200 border border-gray-200 rounded-3xl p-6 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900/50">Total Revenue</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{totalSales.toLocaleString()}</h3>
                    </div>
                  </div>

                  {/* Card: Total Orders */}
                  <div className="bg-white shadow-sm border border-gray-200 border border-gray-200 rounded-3xl p-6 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900/50">Total Orders</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</h3>
                    </div>
                  </div>

                  {/* Card: Products Count */}
                  <div className="bg-white shadow-sm border border-gray-200 border border-gray-200 rounded-3xl p-6 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900/50">Total Products</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{products.length}</h3>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Overview */}
                <div className="bg-white shadow-sm border border-gray-200 border border-gray-200 rounded-3xl p-6">
                  <h3 className="font-bold text-base mb-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#e91e8c]" /> Recent Activity
                  </h3>
                  
                  {orders.length === 0 ? (
                    <p className="text-sm text-gray-900/40 py-8 text-center">No orders received yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map(order => (
                        <div key={order.id} className="flex justify-between items-center p-4 bg-white shadow-sm border border-gray-100 border border-gray-200 rounded-2xl">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Order #{order.id} - {order.customer_name}</p>
                            <p className="text-xs text-gray-900/40 mt-0.5">
                              {new Date(order.created_at).toLocaleDateString()} &bull; {order.items.length} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-purple-600">₹{order.total_amount}</p>
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                              order.status === "pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              order.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2.2 Tab: Product Management */}
            {activeTab === "products" && (
              <div className="space-y-6">
                {/* Actions Toolbar */}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-900/60">Currently showing {products.length} products.</p>
                  <button
                    onClick={() => {
                      setFormMode("add");
                      resetProductForm();
                      setIsFormOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-gray-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-600/15"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                {/* Products Table/Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map(product => (
                    <div 
                      key={product.id}
                      className="bg-white shadow-sm border border-gray-200 border border-gray-200 rounded-3xl p-5 flex gap-4 hover:border-purple-500/20 transition-all group relative"
                    >
                      {/* Image cover fallback */}
                      <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-2 relative overflow-hidden flex-shrink-0 border border-gray-200">
                        {product.image_url ? (
                          <img 
                            src={product.image_url.startsWith("/static") ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}${product.image_url}` : product.image_url} 
                            alt={product.name} 
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <span className="text-black/10 text-4xl font-black">K</span>
                        )}
                      </div>

                      {/* Detail info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-900 truncate leading-snug">{product.name}</h4>
                            {product.tag && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-600 text-gray-900 tracking-wide">
                                {product.tag}
                              </span>
                            )}
                          </div>
                          
                          {/* Prices per weight info */}
                          <div className="flex gap-4 text-xs font-semibold text-gray-900/50 mt-2">
                            {product.price_250g !== null && <span>250g: <strong className="text-gray-900">₹{product.price_250g}</strong></span>}
                            {product.price_500g !== null && <span>500g: <strong className="text-gray-900">₹{product.price_500g}</strong></span>}
                            {product.price_1000g !== null && <span>1kg: <strong className="text-gray-900">₹{product.price_1000g}</strong></span>}
                          </div>
                        </div>

                        {/* Control buttons */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleEditProductClick(product)}
                            className="px-3 py-1.5 rounded-lg bg-white border-gray-300 hover:bg-gray-100 text-gray-900/80 hover:text-gray-900 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProductClick(product.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1 transition-colors ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2.3 Tab: Order Management */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-900/40 py-12 text-center border border-gray-200 rounded-3xl bg-white shadow-sm border border-gray-100">
                    No orders have been received yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white shadow-sm border border-gray-200 border border-gray-200 rounded-3xl p-6 space-y-6">
                        {/* Summary line */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 gap-4">
                          <div>
                            <h3 className="font-bold text-base text-gray-900">Order #{order.id}</h3>
                            <p className="text-xs text-gray-900/40 mt-1">
                              Placed on: {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>

                          {/* Status and Action Dropdown */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-900/50">Status:</span>
                            <select
                              value={order.status}
                              onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider outline-none bg-white border transition-colors ${
                                order.status === "pending" ? "text-amber-400 border-amber-500/20" :
                                order.status === "processing" ? "text-blue-400 border-blue-500/20" :
                                order.status === "shipped" ? "text-purple-400 border-purple-500/20" :
                                order.status === "completed" ? "text-emerald-400 border-emerald-500/20" :
                                "text-red-400 border-red-500/20"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        {/* Customer + Items Split Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          {/* Client Detail */}
                          <div className="space-y-3 bg-white shadow-sm border border-gray-100 border border-gray-200 rounded-2xl p-4">
                            <p className="font-semibold text-gray-900/90 border-b border-gray-200 pb-1">Customer Details</p>
                            <p><span className="text-gray-900/45">Name:</span> {order.customer_name}</p>
                            <p><span className="text-gray-900/45">Email:</span> {order.customer_email}</p>
                            <p><span className="text-gray-900/45">Phone:</span> {order.customer_phone}</p>
                            <p className="leading-relaxed">
                              <span className="text-gray-900/45">Shipping Address:</span><br />
                              <span className="text-xs text-gray-900/70 block mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-200 whitespace-pre-wrap">{order.shipping_address}</span>
                            </p>
                          </div>

                          {/* Order Items Table */}
                          <div className="space-y-3 bg-white shadow-sm border border-gray-100 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between">
                            <div>
                              <p className="font-semibold text-gray-900/90 border-b border-gray-200 pb-1 mb-2">Items</p>
                              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                                {order.items.map((item, index) => (
                                  <div key={index} className="flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-semibold text-gray-900">{item.product_name}</p>
                                      <p className="text-[10px] text-gray-900/50">Weight: {item.weight} &bull; Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-4">
                              <span className="text-xs font-semibold text-gray-900/50">Grand Total:</span>
                              <span className="text-purple-600 font-black text-lg">₹{order.total_amount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Form Modal: Add/Edit Product */}
          <AnimatePresence>
            {isFormOpen && (
              <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end pl-10">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFormOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Sliding Modal Drawer */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
                  className="w-screen max-w-lg h-full bg-white border-l border-purple-100 shadow-2xl relative flex flex-col text-gray-900 z-10"
                >
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#e91e8c]" />
                      {formMode === "add" ? "Create Product" : "Modify Product"}
                    </h2>
                    <button
                      onClick={() => setIsFormOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-900/60 hover:text-gray-900 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleProductSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-900/70 block">Product Name</label>
                        <input
                          type="text"
                          required
                          value={productForm.name}
                          onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-900/20 outline-none focus:border-[#e91e8c] text-sm"
                          placeholder="e.g. Dry Figs (Anjeer)"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-900/70 block">Description (Optional)</label>
                        <textarea
                          rows={2}
                          value={productForm.description}
                          onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-900/20 outline-none resize-none focus:border-[#e91e8c] text-sm"
                          placeholder="Brief description of product features..."
                        />
                      </div>

                      {/* Pricing block */}
                      <div className="bg-white shadow-sm border border-gray-100 border border-gray-200 rounded-2xl p-4 space-y-3">
                        <label className="text-xs font-bold text-[#e91e8c] uppercase tracking-wider block">Prices per Weight (₹)</label>
                        <p className="text-[10px] text-gray-900/40">Enter numerical values. Leave blank if weight size is not offered.</p>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-900/50 block">250g Price</label>
                            <input
                              type="number"
                              value={productForm.price_250g}
                              onChange={(e) => setProductForm(prev => ({ ...prev, price_250g: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 outline-none focus:border-[#e91e8c] text-xs"
                              placeholder="₹250"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-900/50 block">500g Price</label>
                            <input
                              type="number"
                              value={productForm.price_500g}
                              onChange={(e) => setProductForm(prev => ({ ...prev, price_500g: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 outline-none focus:border-[#e91e8c] text-xs"
                              placeholder="₹499"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-900/50 block">1000g Price</label>
                            <input
                              type="number"
                              value={productForm.price_1000g}
                              onChange={(e) => setProductForm(prev => ({ ...prev, price_1000g: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 outline-none focus:border-[#e91e8c] text-xs"
                              placeholder="₹950"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Image Upload Area */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-900/70 block">Product Image</label>
                        <div className="grid grid-cols-2 gap-4">
                          {/* File upload input */}
                          <div className="border-2 border-dashed border-gray-200 hover:border-purple-500/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {uploadProgress ? (
                              <RefreshCw className="w-5 h-5 animate-spin text-[#e91e8c] mb-1" />
                            ) : (
                              <Upload className="w-5 h-5 text-gray-900/50 mb-1" />
                            )}
                            <span className="text-[10px] font-bold text-gray-900/70">Click to Upload File</span>
                          </div>

                          {/* Image Path display & manual URL entry */}
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={productForm.image_url}
                              onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-900/20 outline-none focus:border-[#e91e8c] text-xs"
                              placeholder="Or enter Image URL"
                            />
                            {productForm.image_url && (
                              <div className="h-14 w-14 rounded-lg bg-white flex items-center justify-center p-1 border border-gray-200 overflow-hidden">
                                <img 
                                  src={productForm.image_url.startsWith("/static") ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8088'}${productForm.image_url}` : productForm.image_url} 
                                  alt="Preview" 
                                  className="object-contain max-h-full max-w-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Info & styling meta */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Tag */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-900/70 block">Tag / Label</label>
                          <input
                            type="text"
                            value={productForm.tag}
                            onChange={(e) => setProductForm(prev => ({ ...prev, tag: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-900/20 outline-none focus:border-[#e91e8c] text-sm"
                            placeholder="e.g. Best Seller"
                          />
                        </div>

                        {/* Color gradient styling */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-900/70 block">Gradient Color Class</label>
                          <input
                            type="text"
                            value={productForm.color}
                            onChange={(e) => setProductForm(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 outline-none focus:border-[#e91e8c] text-sm"
                            placeholder="from-purple-900 to-indigo-950"
                          />
                        </div>
                      </div>

                      {/* Mock rating and reviews fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-900/70 block">Rating (1.0 - 5.0)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            value={productForm.rating}
                            onChange={(e) => setProductForm(prev => ({ ...prev, rating: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 outline-none focus:border-[#e91e8c] text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-900/70 block">Reviews Count</label>
                          <input
                            type="number"
                            value={productForm.reviews}
                            onChange={(e) => setProductForm(prev => ({ ...prev, reviews: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 outline-none focus:border-[#e91e8c] text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-200 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold hover:bg-white border-gray-300 text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#e91e8c] text-gray-900 font-bold hover:shadow-[0_0_25px_rgba(233,30,140,0.3)] text-sm transition-all"
                      >
                        {formMode === "add" ? "Save Product" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
