"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Mail, LogIn, Loader2, Key, ArrowLeft } from "lucide-react";

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  picture: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: (callback?: () => void) => void;
  closeLoginModal: () => void;
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, code: string, name: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedUser: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

  // Form States for Email Sign-in & OTP
  const [step, setStep] = useState<"form" | "otp">("form");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [formError, setFormError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8088";

  // Restore session on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("kalindi_user_token");
      const savedProfile = localStorage.getItem("kalindi_user_profile");
      if (savedToken && savedProfile) {
        setToken(savedToken);
        setUser(JSON.parse(savedProfile));
      }
    } catch (e) {
      console.error("Failed to restore auth credentials:", e);
    }
  }, []);

  // Dynamically load Google GSI script and bind callbacks
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "7880036622204-demo-client-id-placeholder.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  // Handle render of Google button in the modal when opened on the form step
  useEffect(() => {
    if (isLoginModalOpen && step === "form" && !user && (window as any).google?.accounts?.id) {
      // Small timeout to guarantee DOM is rendered
      const timer = setTimeout(() => {
        const btnContainer = document.getElementById("google-signin-button-modal");
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoginModalOpen, step, user, authMode]);

  const handleGoogleCredentialResponse = async (response: any) => {
    const credential = response.credential;
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/api/auth/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("kalindi_user_token", data.access_token);
        localStorage.setItem("kalindi_user_profile", JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.access_token);
        setIsLoginModalOpen(false);
        resetForm();
        
        // Trigger success callback (e.g. open cart)
        if (onSuccessCallback) {
          onSuccessCallback();
          setOnSuccessCallback(null);
        }
      } else {
        console.error("Google login failed on backend");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.ok) {
        return true;
      } else {
        const data = await res.json();
        throw new Error(data.detail || "Failed to send verification code.");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, code: string, name: string, password?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const bodyPayload: any = {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        name: name.trim() || "Kalindi Patron",
      };
      if (password) {
        bodyPayload.password = password;
      }
      const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("kalindi_user_token", data.access_token);
        localStorage.setItem("kalindi_user_profile", JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.access_token);
        setIsLoginModalOpen(false);
        resetForm();

        // Trigger success callback (e.g. open cart)
        if (onSuccessCallback) {
          onSuccessCallback();
          setOnSuccessCallback(null);
        }
        return true;
      } else {
        const data = await res.json();
        throw new Error(data.detail || "Invalid or expired OTP code.");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("kalindi_user_token");
    localStorage.removeItem("kalindi_user_profile");
    setUser(null);
    setToken(null);
  };

  const openLoginModal = (callback?: () => void) => {
    if (callback) {
      setOnSuccessCallback(() => callback);
    } else {
      setOnSuccessCallback(null);
    }
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setOnSuccessCallback(null);
    resetForm();
  };

  const resetForm = () => {
    setStep("form");
    setAuthMode("login");
    setEmailInput("");
    setNameInput("");
    setPasswordInput("");
    setConfirmPasswordInput("");
    setOtpInput("");
    setFormError("");
  };

  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!emailInput.trim()) {
      setFormError("Email address is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(emailInput)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!passwordInput) {
      setFormError("Password is required.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/api/auth/login-with-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput.trim().toLowerCase(),
          password: passwordInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("kalindi_user_token", data.access_token);
        localStorage.setItem("kalindi_user_profile", JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.access_token);
        setIsLoginModalOpen(false);
        resetForm();

        if (onSuccessCallback) {
          onSuccessCallback();
          setOnSuccessCallback(null);
        }
      } else {
        const data = await res.json();
        throw new Error(data.detail || "Invalid email or password.");
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordOtpFallback = async () => {
    setFormError("");
    if (!emailInput.trim()) {
      setFormError("Please enter your email address to receive an OTP.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(emailInput)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    try {
      const success = await sendOtp(emailInput);
      if (success) {
        setStep("otp");
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to send code. Please try again.");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!emailInput.trim()) {
      setFormError("Email address is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(emailInput)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!nameInput.trim()) {
      setFormError("Full Name is required.");
      return;
    }
    if (!passwordInput) {
      setFormError("Password is required.");
      return;
    }
    if (passwordInput.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      const success = await sendOtp(emailInput);
      if (success) {
        setStep("otp");
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to send verification code.");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!otpInput.trim()) {
      setFormError("OTP code is required.");
      return;
    }
    if (otpInput.trim().length !== 6) {
      setFormError("OTP code must be 6 digits.");
      return;
    }

    try {
      await verifyOtp(emailInput, otpInput, nameInput, authMode === "signup" ? passwordInput : undefined);
    } catch (err: any) {
      setFormError(err.message || "Invalid verification code. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    setFormError("");
    try {
      const success = await sendOtp(emailInput);
      if (success) {
        setFormError("A new 6-digit code has been sent!");
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to resend code. Please try again.");
    }
  };

  const updateUser = (updatedUser: UserProfile) => {
    localStorage.setItem("kalindi_user_profile", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        sendOtp,
        verifyOtp,
        logout,
        updateUser,
      }}
    >
      {children}

      {/* Luxury Login Modal Overlay */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLoginModal}
              className="absolute inset-0 bg-[#06040a]/80 backdrop-blur-md"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#0f0717]/90 border border-purple-500/20 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_25px_50px_-12px_rgba(61,26,92,0.5)] overflow-hidden text-white flex flex-col items-center"
            >
              {/* Luxury Accent Glow */}
              <div className="absolute -top-20 -left-20 w-48 h-48 bg-[#e91e8c]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#3d1a5c]/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={closeLoginModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon / Branding */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#3d1a5c] to-[#e91e8c] flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6 shrink-0">
                {step === "otp" ? (
                  <Key className="w-7 h-7 text-white" />
                ) : (
                  <LogIn className="w-7 h-7 text-white" />
                )}
              </div>

              {/* Header */}
              <h3 className="text-2xl font-bold tracking-tight mb-2 text-center">
                {step === "form" && "Login or Signup"}
                {step === "otp" && "Verify Email"}
              </h3>
              {step === "otp" && (
                <p className="text-sm text-purple-200/60 max-w-xs mb-6 text-center">
                  We've sent a 6-digit OTP code to {emailInput}. Enter it below to verify your email.
                </p>
              )}

              {/* Loading Indicator */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 w-full">
                  <Loader2 className="w-8 h-8 text-[#e91e8c] animate-spin" />
                  <p className="text-xs text-purple-300">Processing secure request...</p>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-4">
                  <AnimatePresence mode="wait">
                    {step === "form" && (
                      <motion.div
                        key="form-screen"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full flex flex-col gap-4"
                      >
                        {/* Tab Switcher */}
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-purple-500/10 mb-2 w-full">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode("login");
                              setFormError("");
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                              authMode === "login"
                                ? "bg-gradient-to-r from-[#e91e8c] to-[#be185d] text-white shadow-lg"
                                : "text-purple-200/50 hover:text-white"
                            }`}
                          >
                            Login
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode("signup");
                              setFormError("");
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                              authMode === "signup"
                                ? "bg-gradient-to-r from-[#e91e8c] to-[#be185d] text-white shadow-lg"
                                : "text-purple-200/50 hover:text-white"
                            }`}
                          >
                            Sign Up
                          </button>
                        </div>

                        {/* Active Form */}
                        {authMode === "login" ? (
                          <form onSubmit={handlePasswordLoginSubmit} className="w-full flex flex-col gap-3.5 text-left">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold block">Email Address</label>
                              <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-purple-500/10 focus:border-[#e91e8c] text-white placeholder:text-white/20 outline-none text-sm transition-colors"
                                placeholder="e.g. customer@example.com"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold block">Password</label>
                              <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-purple-500/10 focus:border-[#e91e8c] text-white placeholder:text-white/20 outline-none text-sm transition-colors"
                                placeholder="••••••••"
                                required
                              />
                            </div>
                            {formError && (
                              <p className="text-[11px] text-[#e91e8c] font-semibold">{formError}</p>
                            )}
                            <button
                              type="submit"
                              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#e91e8c] to-[#be185d] hover:from-[#f472b6] hover:to-[#be185d] text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-[#e91e8c]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                              Login
                            </button>
                            <div className="text-center mt-1">
                              <button
                                type="button"
                                onClick={handlePasswordOtpFallback}
                                className="text-xs text-purple-200/50 hover:text-white underline cursor-pointer"
                              >
                                Sign in with OTP instead
                              </button>
                            </div>
                          </form>
                        ) : (
                          <form onSubmit={handleSignupSubmit} className="w-full flex flex-col gap-3.5 text-left">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold block">Email Address</label>
                              <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-purple-500/10 focus:border-[#e91e8c] text-white placeholder:text-white/20 outline-none text-sm transition-colors"
                                placeholder="e.g. customer@example.com"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold block">Full Name</label>
                              <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-purple-500/10 focus:border-[#e91e8c] text-white placeholder:text-white/20 outline-none text-sm transition-colors"
                                placeholder="e.g. Jiten Shroff"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold block">Password</label>
                              <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-purple-500/10 focus:border-[#e91e8c] text-white placeholder:text-white/20 outline-none text-sm transition-colors"
                                placeholder="•••••••• (min. 6 characters)"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold block">Confirm Password</label>
                              <input
                                type="password"
                                value={confirmPasswordInput}
                                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-purple-500/10 focus:border-[#e91e8c] text-white placeholder:text-white/20 outline-none text-sm transition-colors"
                                placeholder="••••••••"
                                required
                              />
                            </div>
                            {formError && (
                              <p className="text-[11px] text-[#e91e8c] font-semibold">{formError}</p>
                            )}
                            <button
                              type="submit"
                              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#e91e8c] to-[#be185d] hover:from-[#f472b6] hover:to-[#be185d] text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-[#e91e8c]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                              Sign Up
                            </button>
                          </form>
                        )}

                        {/* Divider */}
                        <div className="flex items-center gap-3 w-full my-1 text-purple-300/30 text-xs uppercase tracking-widest font-bold">
                          <div className="h-px bg-purple-500/10 flex-1" />
                          <span>or sign in with Google</span>
                          <div className="h-px bg-purple-500/10 flex-1" />
                        </div>

                        {/* Google Login Container */}
                        <div className="flex justify-center w-full min-h-[50px]">
                          <div id="google-signin-button-modal"></div>
                        </div>
                      </motion.div>
                    )}

                    {step === "otp" && (
                      <motion.div
                        key="otp-screen"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="w-full flex flex-col gap-4"
                      >
                        {/* OTP Verification Form */}
                        <form onSubmit={handleOtpSubmit} className="w-full flex flex-col gap-4 text-left">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold block text-center">6-Digit Verification Code</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                              className="w-full text-center px-4 py-3.5 rounded-2xl bg-white/5 border border-purple-500/10 focus:border-[#e91e8c] text-white placeholder:text-white/10 outline-none text-2xl font-bold tracking-[0.5em] transition-colors"
                              placeholder="••••••"
                              autoFocus
                            />
                          </div>

                          {formError && (
                            <p className={`text-[11px] text-center font-semibold ${formError.includes("sent") ? "text-emerald-400" : "text-[#e91e8c]"}`}>
                              {formError}
                            </p>
                          )}

                          <button
                            type="submit"
                            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#e91e8c] to-[#be185d] hover:from-[#f472b6] hover:to-[#be185d] text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-[#e91e8c]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          >
                            <Key className="w-4 h-4 text-white" />
                            {authMode === "signup" ? "Verify & Register" : "Verify & Enter Store"}
                          </button>
                        </form>

                        {/* Back / Resend Triggers */}
                        <div className="flex items-center justify-between text-xs mt-3 px-1 text-purple-200/50">
                          <button
                            onClick={() => {
                              setStep("form");
                              setOtpInput("");
                              setFormError("");
                            }}
                            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                          </button>
                          
                          <button
                            onClick={handleResendOtp}
                            className="hover:text-white transition-colors underline cursor-pointer"
                          >
                            Resend Code
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Footer Trust Details */}
              <div className="mt-8 flex items-center gap-2 text-[10px] text-purple-200/40 font-medium tracking-wide">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Secure SSL encryption standard</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
