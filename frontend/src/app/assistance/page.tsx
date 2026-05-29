"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Gift,
  Compass,
  Check,
  Loader2,
  Trash2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Menu,
  X,
  Edit2,
  LogOut,
  User,
  Sparkles,
  Lock,
  ShoppingBag,
  RotateCcw
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import ChatProductCard from "@/components/ChatProductCard";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: number;
  email: string;
  name: string;
  picture: string;
}

const quickChips = [
  { text: "California Almonds", query: "Show California Almonds with price" },
  { text: "Luxury Gift Box", query: "Show me details of the Kalindi Assorted Gift Box" },
  { text: "Health & Wellness", query: "What are the health benefits of Medjool Dates and Turkish Figs?" },
  { text: "Saffron Pistachios", query: "Tell me about Saffron Pistachios and how they compare to cashews" },
];

export default function AssistancePage() {
  const { cartItems, addToCart, clearCart, cartCount, setIsCartOpen } = useCart();
  const [activePanel, setActivePanel] = useState<"quiz" | "hamper" | null>(null);
  
  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Session / History state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleVal, setEditTitleVal] = useState("");
  
  // Mobile responsiveness
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `I am your **Personal Shopper**. How may I tailor your dry fruit selection today? 

Let's craft the perfect custom hamper, evaluate your wellness needs, or answer questions about our premium global selections!`,
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCartBumping, setIsCartBumping] = useState(false);

  useEffect(() => {
    if (cartCount === 0) return;
    setIsCartBumping(true);
    const timer = setTimeout(() => setIsCartBumping(false), 500);
    return () => clearTimeout(timer);
  }, [cartCount]);

  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  // Quiz State
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({
    goal: "",
    taste: "",
    recipient: "",
  });

  // Hamper State
  const [selectedHamperProducts, setSelectedHamperProducts] = useState<number[]>([1, 2, 3]); // default selected IDs
  const [hamperAddedStatus, setHamperAddedStatus] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8088";

  // 1. Initial Authentication & Google Script Setup
  useEffect(() => {
    // Load existing credentials from LocalStorage
    const savedToken = localStorage.getItem("kalindi_user_token");
    const savedProfile = localStorage.getItem("kalindi_user_profile");
    if (savedToken && savedProfile) {
      try {
        setToken(savedToken);
        const parsedProfile = JSON.parse(savedProfile);
        setUser(parsedProfile);
        fetchSessions(savedToken);
      } catch (e) {
        console.error("Failed to restore saved credentials:", e);
      }
    }

    // Dynamically load Google GSI script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "7880036622204-demo-client-id-placeholder.apps.googleusercontent.com", // client id
          callback: handleGoogleCredentialResponse,
        });

        const btnContainer = document.getElementById("google-signin-button");
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
          });
        }
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  // Sync Google buttons if user login state changes
  useEffect(() => {
    if (!user && (window as any).google?.accounts?.id) {
      setTimeout(() => {
        const btnContainer = document.getElementById("google-signin-button");
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
          });
        }
      }, 100);
    }
  }, [user]);

  // Load chat history when selected session changes
  useEffect(() => {
    if (currentSessionId && token) {
      fetchSessionMessages(currentSessionId, token);
    } else {
      // Revert to demo chat from sessionStorage or default welcome
      const savedChat = sessionStorage.getItem("kalindi_chat_history");
      if (savedChat) {
        try {
          setMessages(JSON.parse(savedChat));
        } catch (e) {
          console.error("Failed to parse saved chat history:", e);
        }
      } else {
        setMessages([
          {
            role: "assistant",
            content: `### Welcome to the Kalindi Luxury Concierge
I am your **Personal Shopper**, here to help you select our finest dry fruits, nuts, and seeds.

**How may I assist you today?**
* **Signature Products**: Inquire about our *Almonds*, *Saffron Pistachios*, *Cashews*, or *Medjool Dates*.
* **Wellness Evaluation**: Expand our brief **Wellness Fit Quiz** in the top panel for a curated recommendation.
* **Bespoke Hamper**: Click the **custom Hampers** tab above to build a custom luxury dry fruit box.

*Feel free to dictate your message using the microphone button below.*`,
          },
        ]);
      }
    }
  }, [currentSessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speech recognition initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputVal((prev) => (prev ? prev + " " + transcript : transcript));
        };

        rec.onerror = (e: any) => {
          console.error("Speech Recognition Error:", e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // 2. Fetch Sessions
  const fetchSessions = async (authToken: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/history/sessions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Failed to load chat history sessions:", e);
    }
  };

  // 3. Fetch messages for session
  const fetchSessionMessages = async (sessionId: string, authToken: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/api/history/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (e) {
      console.error("Failed to fetch session messages:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Google Auth handler
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
        fetchSessions(data.access_token);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Concierge Demo Sign-In Simulation
  const handleDemoSignIn = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/api/auth/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_demo: true,
          email: "connoisseur@kalindi.com",
          name: "Guest Connoisseur",
          picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("kalindi_user_token", data.access_token);
        localStorage.setItem("kalindi_user_profile", JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.access_token);
        fetchSessions(data.access_token);
      }
    } catch (error) {
      console.error("Error signing in with demo account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Sign out
  const handleSignOut = () => {
    localStorage.removeItem("kalindi_user_token");
    localStorage.removeItem("kalindi_user_profile");
    setUser(null);
    setToken(null);
    setSessions([]);
    setCurrentSessionId(null);
    setMessages([
      {
        role: "assistant",
        content: `I am your **Personal Shopper**. How may I tailor your dry fruit selection today? 

Let's craft the perfect custom hamper, evaluate your wellness needs, or answer questions about our premium global selections!`,
      },
    ]);
  };

  // 7. Initialize a New Consultation
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      {
        role: "assistant",
        content: `### New Luxury AI Consultation
I am your **Personal Shopper**. How may I tailor your dry fruit selection today? 

Let's craft the perfect custom hamper, evaluate your wellness needs, or answer questions about our premium global selections!`,
      },
    ]);
    setMobileSidebarOpen(false);
  };

  // 7.5. Reorder previous order automatically
  const handleAddLastOrderToCart = async () => {
    if (!user?.email) {
      alert("Please sign in first using the sidebar to retrieve your last order.");
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/orders/last?email=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const order = await response.json();
        if (order && order.items) {
          // Clear current cart items first so we only reorder the last purchase
          clearCart();

          // Loop through each item in the order and add it to the cart
          for (const item of order.items) {
            let imageUrl = "/almonds.png";
            let color = "from-[#D2B48C] to-[#8B6914]";
            
            try {
              const prodRes = await fetch(`${apiUrl}/api/products/${item.product_id}`);
              if (prodRes.ok) {
                const prod = await prodRes.json();
                imageUrl = prod.image_url || imageUrl;
                color = prod.color || color;
              }
            } catch (e) {
              console.warn("Could not fetch product details, using fallbacks:", e);
            }
            
            // Add to cart
            addToCart(
              {
                id: item.product_id,
                name: item.product_name,
                image_url: imageUrl,
                color: color,
              },
              item.weight,
              item.price,
              true // open cart drawer to show items added
            );
          }
        }
      }
    } catch (e) {
      console.error("Failed to add previous order items to cart:", e);
    }
  };

  // 8. Rename Session Title
  const handleRenameSession = async (sessionId: string) => {
    if (!editTitleVal.trim() || !token) return;
    try {
      const res = await fetch(`${apiUrl}/api/history/sessions/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editTitleVal }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSessions(sessions.map((s) => (s.id === sessionId ? updated : s)));
        setEditingSessionId(null);
      }
    } catch (e) {
      console.error("Failed to rename session:", e);
    }
  };

  // 9. Delete Session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this consultation history?") || !token) return;
    try {
      const res = await fetch(`${apiUrl}/api/history/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
      }
    } catch (e) {
      console.error("Failed to delete session:", e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech Recognition start failed:", e);
      }
    }
  };

  // 10. Send Message with SSE stream & DB Persistence
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    let sessionId = currentSessionId;
    const isNewSession = !sessionId;

    // A. If logged in and this is a new session, auto-create it on backend
    if (token && user && isNewSession) {
      const newUuid = crypto.randomUUID();
      // Generate elegant short title based on query
      const slicedTitle = textToSend.length > 25 ? textToSend.substring(0, 25) + "..." : textToSend;
      try {
        const res = await fetch(`${apiUrl}/api/history/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: newUuid,
            title: slicedTitle,
          }),
        });
        if (res.ok) {
          sessionId = newUuid;
          setCurrentSessionId(newUuid);
          const newSess = await res.json();
          setSessions((prev) => [newSess, ...prev]);
        }
      } catch (e) {
        console.error("Failed to create session on DB:", e);
      }
    }

    // B. Append user message locally
    const newHistory: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newHistory);
    setInputVal("");
    setIsLoading(true);

    // C. Persist user message in DB (if logged in)
    if (token && sessionId) {
      try {
        await fetch(`${apiUrl}/api/history/sessions/${sessionId}/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: "user",
            content: textToSend,
          }),
        });
      } catch (e) {
        console.error("Failed to save user message to DB:", e);
      }
    }

    // D. Stream assistant reply via SSE
    try {
      const response = await fetch(`${apiUrl}/api/agent/chat-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newHistory,
          user_id: user?.id || null,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessageContent = "";

        const nextHistory: Message[] = [...newHistory, { role: "assistant", content: "" }];
        setMessages(nextHistory);
        setIsLoading(false);

        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // Hold incomplete lines in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.substring(6);
              if (dataStr.trim() === "[DONE]") continue;
              
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed && typeof parsed.content === "string") {
                  assistantMessageContent += parsed.content;
                } else {
                  assistantMessageContent += dataStr;
                }
              } catch (e) {
                assistantMessageContent += dataStr;
              }

              setMessages((prev) => {
                const next = [...prev];
                if (next.length > 0) {
                  next[next.length - 1] = {
                    role: "assistant",
                    content: assistantMessageContent,
                  };
                }
                return next;
              });
            }
          }
        }

        // Check for reorder signal tag
        if (assistantMessageContent.includes("[ADD_LAST_ORDER_TO_CART]")) {
          assistantMessageContent = assistantMessageContent.replace(/\[ADD_LAST_ORDER_TO_CART\]/g, "").trim();
          setMessages((prev) => {
            const next = [...prev];
            if (next.length > 0) {
              next[next.length - 1] = {
                role: "assistant",
                content: assistantMessageContent,
              };
            }
            return next;
          });
          handleAddLastOrderToCart();
        }

        // E. Persist assistant message in DB (if logged in)
        if (token && sessionId) {
          try {
            await fetch(`${apiUrl}/api/history/sessions/${sessionId}/message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                role: "assistant",
                content: assistantMessageContent,
              }),
            });
            // Touch/Refresh sessions to display updated timestamp
            fetchSessions(token);
          } catch (e) {
            console.error("Failed to save assistant message to DB:", e);
          }
        } else {
          // If guest, save locally
          sessionStorage.setItem(
            "kalindi_chat_history",
            JSON.stringify([...newHistory, { role: "assistant", content: assistantMessageContent }])
          );
        }
      } else {
        console.error("Backend response error");
        const errHistory: Message[] = [
          ...newHistory,
          {
            role: "assistant",
            content:
              "Forgive me, my connection to the server is experiencing an elegant delay. Please verify if the API is active or try again shortly.",
          },
        ];
        setMessages(errHistory);
      }
    } catch (e) {
      console.error("Network error:", e);
      const errHistory: Message[] = [
        ...newHistory,
        {
          role: "assistant",
          content:
            "Forgive me, my connection to the server is experiencing an elegant delay. Please verify if the API is active or try again shortly.",
        },
      ];
      setMessages(errHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = () => {
    if (confirm("Would you like to reset your wellness chat history?")) {
      sessionStorage.removeItem("kalindi_chat_history");
      handleNewChat();
    }
  };

  // Submit Wellness Quiz & Persist user memories
  const handleQuizSubmit = async (finalAnswers: typeof quizAnswers) => {
    // 1. If user is logged in, write choices to long-term database memories
    if (user && token) {
      try {
        await fetch(`${apiUrl}/api/history/memory`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ key: "goal", value: finalAnswers.goal }),
        });
        await fetch(`${apiUrl}/api/history/memory`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ key: "taste", value: finalAnswers.taste }),
        });
        await fetch(`${apiUrl}/api/history/memory`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ key: "recipient", value: finalAnswers.recipient }),
        });
      } catch (e) {
        console.error("Failed to persist user memories on backend database:", e);
      }
    }

    const quizPrompt = `I just finished the Kalindi Wellness Fit Quiz! Here are my diagnoses:
- **Primary Health Goal**: ${finalAnswers.goal}
- **Favorite Flavor Profile**: ${finalAnswers.taste}
- **Shopping Intent**: Sourced for ${finalAnswers.recipient}

Please diagnose my results and recommend a tailored luxury dry fruits selection from your catalog! Explain their benefits.`;

    setQuizStep(1);
    setActivePanel(null); // fold drawer
    handleSendMessage(quizPrompt);
  };

  // Hamper Builder Add-to-Cart
  const handleAddHamperToCart = () => {
    const productsList = [
      { id: 1, name: "Premium California Almonds", price: 279, image_url: "/almonds.png", color: "from-[#D2B48C] to-[#8B6914]" },
      { id: 2, name: "Saffron Pistachios", price: 399, image_url: "/pistachios.png", color: "from-[#8B9467] to-[#556B2F]" },
      { id: 3, name: "Royal Cashews W320", price: 299, image_url: "/cashews.png", color: "from-[#F5DEB3] to-[#D2691E]" },
      { id: 4, name: "Medjool Dates", price: 289, image_url: "/dates.png", color: "from-[#8B4513] to-[#3D1F00]" },
      { id: 5, name: "Turkish Figs", price: 379, image_url: "/figs.png", color: "from-[#7B3F8C] to-[#3d1a5c]" },
      { id: 6, name: "Jumbo Raisins", price: 169, image_url: "/raisins.png", color: "from-[#722F37] to-[#3D0C11]" },
      { id: 7, name: "Fox Nuts (Makhana)", price: 249, image_url: "/makhana.png", color: "from-[#F5F5DC] to-[#D2B48C]" },
    ];

    selectedHamperProducts.forEach((id) => {
      const match = productsList.find((p) => p.id === id);
      if (match) {
        addToCart(
          {
            id: match.id,
            name: match.name,
            image_url: match.image_url,
            color: match.color,
          },
          "250g",
          match.price,
          false
        );
      }
    });

    setHamperAddedStatus(true);
    setTimeout(() => {
      setHamperAddedStatus(false);
    }, 3000);
  };

  // Inline markdown formatter: bold, italic, numbered lists markers
  const applyInlineMarkdown = (text: string): string => {
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, "<strong class='font-bold text-purple-950'>$1</strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-purple-950'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em class='italic text-purple-900/80'>$1</em>");
  };

  // Robust block-level markdown parser — never splits words across paragraphs
  const renderMessageContent = (text: string) => {
    const cleanedText = text.replace(/\[ADD_LAST_ORDER_TO_CART\]/gi, "").trim();

    // 1. Casing safeguard for all-caps AI responses
    const upperCount = (cleanedText.match(/[A-Z]/g) || []).length;
    const lowerCount = (cleanedText.match(/[a-z]/g) || []).length;
    let processedText = cleanedText;
    if (upperCount > 15 && (lowerCount === 0 || upperCount / lowerCount > 1.5)) {
      processedText = cleanedText
        .toLowerCase()
        .replace(/(^\s*(?:[\*\-\+]\s+|\d+\.\s+)?)([a-z])/gm, (m, p1, p2) => p1 + p2.toUpperCase())
        .replace(/([.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())
        .replace(/\bkalindi\b/gi, "Kalindi")
        .replace(/\balmond(s?)\b/gi, "Almond$1")
        .replace(/\bcashew(s?)\b/gi, "Cashew$1")
        .replace(/\bpistachio(s?)\b/gi, "Pistachio$1")
        .replace(/\bdate(s?)\b/gi, "Date$1")
        .replace(/\bfig(s?)\b/gi, "Fig$1")
        .replace(/\braisin(s?)\b/gi, "Raisin$1")
        .replace(/\bmakhana\b/gi, "Makhana")
        .replace(/\bcalifornia\b/gi, "California")
        .replace(/\bturkish\b/gi, "Turkish")
        .replace(/\bkashmiri\b/gi, "Kashmiri")
        .replace(/\bsaffron\b/gi, "Saffron");
    }

    // 2. Normalize line endings
    processedText = processedText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 3. Split by PRODUCT_ID tags first (they are block-level special tokens)
    const productTagRegex = /(\[PRODUCT_ID:\s*\d+\])/gi;
    const segments = processedText.split(productTagRegex);

    const elements: React.ReactNode[] = [];

    // Group consecutive product card tags to display side-by-side
    const groupedSegments: ({ type: "text"; content: string } | { type: "products"; ids: number[] })[] = [];
    
    segments.forEach((segment) => {
      if (!segment) return;
      const productMatch = segment.match(/\[PRODUCT_ID:\s*(\d+)\]/i);
      if (productMatch) {
        const productId = parseInt(productMatch[1]);
        const lastGroup = groupedSegments[groupedSegments.length - 1];
        if (lastGroup && lastGroup.type === "products") {
          lastGroup.ids.push(productId);
        } else {
          groupedSegments.push({ type: "products", ids: [productId] });
        }
      } else {
        if (segment.trim()) {
          groupedSegments.push({ type: "text", content: segment });
        }
      }
    });

    groupedSegments.forEach((group, groupIdx) => {
      if (group.type === "products") {
        elements.push(
          <div key={`prod-group-${groupIdx}`} className="flex flex-wrap gap-4 my-3 select-none" data-lenis-prevent>
            {group.ids.map((productId, subIdx) => (
              <ChatProductCard key={`prod-${productId}-${subIdx}`} productId={productId} />
            ))}
          </div>
        );
        return;
      }

      const segment = group.content;

      // 4. Parse the text segment into semantic blocks
      // Group consecutive lines into logical blocks: headers, bullet lists, numbered lists, paragraphs
      const lines = segment.split("\n");
      const blocks: { type: string; content: string[] }[] = [];
      let currentBlock: { type: string; content: string[] } | null = null;

      lines.forEach((rawLine) => {
        const line = rawLine;
        const trimmed = line.trim();

        if (trimmed === "") {
          // Blank line ends current block
          if (currentBlock) {
            blocks.push(currentBlock);
            currentBlock = null;
          }
          return;
        }

        // Header: ### or ## or #
        if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          if (currentBlock) blocks.push(currentBlock);
          blocks.push({ type: "header", content: [trimmed] });
          currentBlock = null;
          return;
        }

        // Bullet: *, -, or +
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("+ ")) {
          if (currentBlock && currentBlock.type !== "bullet") {
            blocks.push(currentBlock);
            currentBlock = null;
          }
          if (!currentBlock) currentBlock = { type: "bullet", content: [] };
          currentBlock.content.push(trimmed.replace(/^[\*\-\+]\s+/, ""));
          return;
        }

        // Numbered list: 1. 2. etc
        if (/^\d+\.\s+/.test(trimmed)) {
          if (currentBlock && currentBlock.type !== "numbered") {
            blocks.push(currentBlock);
            currentBlock = null;
          }
          if (!currentBlock) currentBlock = { type: "numbered", content: [] };
          currentBlock.content.push(trimmed.replace(/^\d+\.\s+/, ""));
          return;
        }

        // Regular paragraph — join continuation lines with a space (not a new paragraph)
        if (currentBlock && currentBlock.type === "paragraph") {
          currentBlock.content[0] += " " + trimmed;
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: "paragraph", content: [trimmed] };
        }
      });

      if (currentBlock) blocks.push(currentBlock);

      // 5. Render each block
      blocks.forEach((block, blockIdx) => {
        const key = `seg${groupIdx}-blk${blockIdx}`;

        if (block.type === "header") {
          const raw = block.content[0];
          const headerText = raw.replace(/^#{1,3}\s+/, "");
          elements.push(
            <h3
              key={key}
              className="font-bold text-base md:text-[17px] tracking-wide text-purple-950 mt-5 mb-2 flex items-center gap-2"
            >
              <span className="w-1.5 h-4 bg-[#5b21b6] rounded-full inline-block flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: applyInlineMarkdown(headerText) }} />
            </h3>
          );
          return;
        }

        if (block.type === "bullet") {
          elements.push(
            <ul key={key} className="my-2 space-y-1.5 pl-1">
              {block.content.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-2 text-base text-slate-700 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: applyInlineMarkdown(item) }} />
                </li>
              ))}
            </ul>
          );
          return;
        }

        if (block.type === "numbered") {
          elements.push(
            <ol key={key} className="my-2 space-y-1.5 pl-1">
              {block.content.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-2.5 text-base text-slate-700 leading-relaxed"
                >
                  <span className="font-bold text-purple-600 text-sm min-w-[18px] mt-0.5">{itemIdx + 1}.</span>
                  <span dangerouslySetInnerHTML={{ __html: applyInlineMarkdown(item) }} />
                </li>
              ))}
            </ol>
          );
          return;
        }

        // Paragraph
        if (block.type === "paragraph" && block.content[0].trim()) {
          elements.push(
            <p
              key={key}
              className="text-base md:text-[17px] text-slate-800 leading-relaxed mb-2"
              dangerouslySetInnerHTML={{ __html: applyInlineMarkdown(block.content[0]) }}
            />
          );
        }
      });
    });

    return <>{elements}</>;
  };

  return (
    <div className="flex w-full overflow-hidden bg-transparent" style={{ height: '100dvh' }}>
      {/* 1. LEFT SIDEBAR: previous consultations chat history & Auth panel */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-40 w-[295px] md:relative md:flex flex-col backdrop-blur-md border-r border-purple-200/50 text-slate-900 transition-transform duration-300 shadow-xl md:shadow-none md:h-full shrink-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ backgroundColor: 'rgba(255,255,255,0.96)' }}
      >
        {/* Sidebar close button for mobile */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-950 md:hidden transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sidebar Header */}
        <div className="p-5 border-b border-purple-100/55 flex flex-col gap-4 bg-purple-50/20">
          <div className="flex items-center justify-center">
            <img
              src="/kalindi.png"
              alt="Kalindi Logo"
              className="h-8 object-contain"
            />
          </div>
          
          <button
            onClick={handleNewChat}
            className="w-full py-3 px-4 rounded-xl border border-purple-300/60 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-100/55 text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center justify-center gap-2 transition-all duration-300 shadow-3xs hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New consultation
          </button>
        </div>

        {/* Scrollable Conversations List */}
        <div className="flex-grow overflow-y-auto px-3 py-4 space-y-1.5" data-lenis-prevent>
          <p className="text-[10px] text-purple-900/50 uppercase tracking-widest font-extrabold px-3 mb-2.5">
            Previous Conversations
          </p>

          {!user ? (
            <div className="p-4 bg-purple-50/40 border border-purple-200/40 rounded-2xl text-center space-y-3 mx-2 my-2 shadow-inner">
              <Lock className="w-6 h-6 text-purple-700 mx-auto opacity-75" />
              <p className="text-[11px] text-purple-950/75 font-light leading-relaxed">
                Log in to unlock long-term memory personalization and auto-save your consultation histories!
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-purple-900/40 italic">
              No previous sessions. Start your first consultation above!
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = currentSessionId === sess.id;
              const isEditing = editingSessionId === sess.id;

              return (
                <div
                  key={sess.id}
                  className={`group relative flex items-center justify-between rounded-xl p-3 text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-purple-100/60 text-purple-950 border-l-4 border-[#3d1a5c] shadow-2xs font-semibold"
                      : "text-slate-700 hover:bg-purple-50 hover:text-purple-950"
                  }`}
                  onClick={() => !isEditing && setCurrentSessionId(sess.id)}
                >
                  <div className="flex items-center gap-2.5 truncate flex-grow pr-6">
                    <MessageSquare className={`w-3.5 h-3.5 ${isActive ? "text-purple-700" : "text-purple-300"}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitleVal}
                        onChange={(e) => setEditTitleVal(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenameSession(sess.id)}
                        onBlur={() => handleRenameSession(sess.id)}
                        autoFocus
                        className="bg-white border border-purple-300 rounded-md px-1.5 py-0.5 text-purple-955 w-full outline-hidden text-xs"
                      />
                    ) : (
                      <span className="truncate">{sess.title}</span>
                    )}
                  </div>

                  {/* Actions (visible on hover) */}
                  {!isEditing && isActive && (
                    <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white via-white to-transparent pl-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(sess.id);
                          setEditTitleVal(sess.title);
                        }}
                        title="Rename"
                        className="p-1 rounded-md hover:bg-purple-100/50 text-purple-700 hover:text-purple-955"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(sess.id);
                        }}
                        title="Delete"
                        className="p-1 rounded-md hover:bg-red-50 text-purple-800 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer User Accounts panel */}
        <div className="p-4 border-t border-purple-200/50 bg-purple-50/40">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border border-amber-500/30 object-cover"
                />
                <div className="text-left">
                  <p className="font-bold text-xs text-slate-900 truncate max-w-[130px]">{user.name}</p>
                  <p className="text-[10px] text-purple-700 uppercase tracking-widest font-black">
                    Connoisseur
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 rounded-xl bg-purple-100/40 hover:bg-red-50 text-purple-800 hover:text-red-600 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 py-1">
              <button
                onClick={handleDemoSignIn}
                className="w-full py-2.5 rounded-xl bg-[#3d1a5c] hover:bg-[#28113e] text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-102"
              >
                <Sparkles className="w-3.5 h-3.5" /> Concierge Demo Sign-In
              </button>
              
              {/* Google GSI Auth container */}
              <div className="flex justify-center w-full scale-95 origin-center">
                <div id="google-signin-button"></div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Dimmed mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* 2. MAIN CONCIERGE CHAT CONTAINER PANEL */}
      <main data-page="assistance" className="flex-1 flex flex-col h-full overflow-hidden relative w-full bg-transparent">
        {/* Unified Luxury Chat Widget Card */}
        <div className="w-full h-full flex flex-col border-none justify-between bg-transparent">
          
          {/* Card Header (with menu toggle for mobile & embedded panel toggles) */}
          <div className="p-4 text-purple-950 flex items-center justify-between border-b border-purple-200/50 shrink-0 shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.97)' }}>
            <div className="flex items-center gap-2.5">
              {/* Mobile sidebar trigger */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-purple-100/50 text-purple-800 md:hidden shrink-0 transition-colors"
                title="Open History"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link
                href="/"
                className="p-1.5 rounded-lg hover:bg-amber-600/10 text-amber-900 transition-colors inline-flex"
                title="Return to Home"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <div className="w-10 h-10 rounded-full border border-purple-200/50 flex items-center justify-center bg-purple-100 shrink-0 shadow-inner">
                <span className="text-sm font-extrabold text-purple-800">K</span>
              </div>
              <div className="text-left hidden sm:block">
                <h3 className="font-bold text-sm tracking-wider uppercase text-purple-950">
                  Guest Services Concierge
                </h3>
                <p className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">
                  Your Personal Shopper
                </p>
              </div>
            </div>

            {/* EMBEDDED DIAGNOSTIC TOOLS TRIGGER TABS (Inside header for maximum compactness) */}
            <div className="flex items-center gap-1.5 max-w-[280px] xs:max-w-sm sm:max-w-md">
              <button
                onClick={() => setActivePanel(activePanel === "quiz" ? null : "quiz")}
                className={`py-2 px-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1 cursor-pointer border ${
                  activePanel === "quiz"
                    ? "bg-[#3d1a5c] border-[#3d1a5c] text-white shadow-xs"
                    : "bg-purple-50 border border-purple-200/50 text-purple-900 hover:text-purple-955 hover:bg-purple-100/50"
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Wellness Fit</span> Quiz
                {activePanel === "quiz" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                onClick={() => setActivePanel(activePanel === "hamper" ? null : "hamper")}
                className={`py-2 px-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1 cursor-pointer border ${
                  activePanel === "hamper"
                    ? "bg-[#3d1a5c] border-[#3d1a5c] text-white shadow-xs"
                    : "bg-purple-50 border border-purple-200/50 text-purple-900 hover:text-purple-955 hover:bg-purple-100/50"
                }`}
              >
                <Gift className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Bespoke</span> Hamper
                {activePanel === "hamper" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                onClick={handleAddLastOrderToCart}
                className="py-2 px-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-purple-50 border border-purple-200/50 text-purple-900 hover:text-purple-955 hover:bg-purple-100/50 flex items-center gap-1 cursor-pointer transition-colors"
                title="Reorder Last Purchase"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-700" /> <span>Reorder</span>
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                title="Open Cart"
                className={`p-2 rounded-lg transition-all duration-300 cursor-pointer shrink-0 relative border ${
                  cartCount > 0
                    ? "bg-amber-500 border-amber-500 text-white shadow-md hover:bg-amber-600 hover:border-amber-600"
                    : "bg-purple-50 border-purple-200/50 text-purple-800 hover:bg-purple-100/50"
                } ${isCartBumping ? "scale-125 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.6)]" : "scale-100"}`}
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-amber-600 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs border border-amber-500/20">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={clearChatHistory}
                title="Clear Chat"
                className="p-2 rounded-lg hover:bg-purple-100/50 text-purple-800 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* UNIFIED DRAWER: Quiz & Hampers panels slide down inside unified card container */}
          <AnimatePresence>
            {activePanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden border-b border-purple-200/40 bg-purple-50/50 backdrop-blur-md shrink-0"
              >
                <div className="p-5 text-left max-h-[300px] overflow-y-auto" data-lenis-prevent>
                  
                  {/* Embedded Quiz Section */}
                  {activePanel === "quiz" && (
                    <div className="flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-800 bg-purple-100/60 px-2.5 py-0.5 rounded-full">
                            Step {quizStep} of 3
                          </span>
                          {user && (
                            <span className="text-[9px] text-purple-800 bg-purple-100/60 border border-purple-200/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Saves to Memory
                            </span>
                          )}
                        </div>

                        {quizStep === 1 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                            <h4 className="font-bold text-purple-955 text-xs sm:text-sm mb-1">
                              Select your primary health aspiration:
                            </h4>
                            <p className="text-[10px] text-purple-900/60 mb-2.5 font-light">
                              We customize suggestions containing specific luxury nutrients.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                { title: "Radiant Glow & Skin Wellness", desc: "Rich in Vitamin E, collagen support (Almonds, Makhana)", key: "Glow & Skin Wellness" },
                                { title: "Sustained Peak Energy", desc: "Copper, Iron, Soluble fibers (Jumbo Cashews, Medjool Dates)", key: "Peak Performance & Cellular Energy" },
                                { title: "Balanced Lifestyle Snacking", desc: "Low glycemic, highly crunchy (Roasted Makhana, Figs)", key: "Weight Loss & Healthy Snacking" },
                                { title: "Immunity & Cardiovascular Support", desc: "Kashmiri Saffron, organic antioxidants (Pistachios, Raisins)", key: "Immunity Boost & Heart Health" },
                              ].map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => {
                                    setQuizAnswers({ ...quizAnswers, goal: opt.key });
                                    setQuizStep(2);
                                  }}
                                  className="text-left p-3 rounded-xl border border-purple-200/40 bg-white hover:border-purple-400 hover:bg-purple-50/30 transition-all shadow-3xs cursor-pointer"
                                >
                                  <p className="font-bold text-xs text-purple-955">{opt.title}</p>
                                  <p className="text-[9px] text-purple-900/60 mt-0.5">{opt.desc}</p>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {quizStep === 2 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                            <h4 className="font-bold text-purple-955 text-xs sm:text-sm mb-1">
                              What flavor profile do you naturally adore?
                            </h4>
                            <p className="text-[10px] text-purple-900/60 mb-2.5 font-light">
                              Helping us understand your taste palette preference.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                { title: "Natural Sweet & Sun-Dried Fruits", desc: "Imported Medjool Dates, Sun-dried Figs, Green Raisins", key: "Sweet & Natural Sun-Dried Fruits" },
                                { title: "Roasted, Crispy & Nutty Options", desc: "Crunchy California Almonds, Seasoned Makhana", key: "Roasted & Savory Crispy Nuts" },
                                { title: "Rich & Creamy Indulgence", desc: "Jumbo Grade White Cashews", key: "Rich, Buttery, and Mild Nuts" },
                                { title: "Bespoke Collection Gift Box", desc: "A luxurious blend of everything", key: "Luxury Assortments" },
                              ].map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => {
                                    setQuizAnswers({ ...quizAnswers, taste: opt.key });
                                    setQuizStep(3);
                                  }}
                                  className="text-left p-3 rounded-xl border border-purple-200/40 bg-white hover:border-purple-400 hover:bg-purple-50/30 transition-all shadow-3xs cursor-pointer"
                                >
                                  <p className="font-bold text-xs text-purple-955">{opt.title}</p>
                                  <p className="text-[9px] text-purple-900/60 mt-0.5">{opt.desc}</p>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {quizStep === 3 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                            <h4 className="font-bold text-purple-955 text-xs sm:text-sm mb-1">
                              Who is this boutique order for?
                            </h4>
                            <p className="text-[10px] text-purple-900/60 mb-2.5 font-light">
                              Customizing packaging and gift recommendations.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {[
                                { title: "Personal Snacking", desc: "Daily physical health & nutrition", key: "Myself (Self-Care & Daily Nutrition)" },
                                { title: "Family Health", desc: "Wellness support for kids and elders", key: "My family's health and wellness" },
                                { title: "Luxury Gifting", desc: "Bespoke corporate/personal boxes", key: "Gifting (Anniversaries, Festivals, Corporate Gifting)" },
                              ].map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => {
                                    const final = { ...quizAnswers, recipient: opt.key };
                                    setQuizAnswers(final);
                                    handleQuizSubmit(final);
                                  }}
                                  className="text-left p-3 rounded-xl border border-purple-200/40 bg-white hover:border-purple-400 hover:bg-purple-50/30 transition-all shadow-3xs cursor-pointer"
                                >
                                  <p className="font-bold text-xs text-purple-955">{opt.title}</p>
                                  <p className="text-[9px] text-purple-900/60 mt-0.5">{opt.desc}</p>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {quizStep > 1 && (
                        <button
                          onClick={() => setQuizStep(quizStep - 1)}
                          className="mt-3 px-3.5 py-1.5 text-[10px] font-bold text-purple-800 bg-purple-100/50 border border-purple-200/40 rounded-full hover:bg-purple-700 hover:text-white transition-all w-20 text-center cursor-pointer"
                        >
                          ← Back
                        </button>
                      )}
                    </div>
                  )}

                  {/* Embedded Hamper Section */}
                  {activePanel === "hamper" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                      {/* Box Preview */}
                      <div className="md:col-span-5 p-3.5 bg-purple-50/80 backdrop-blur-md rounded-2xl text-slate-800 flex flex-col justify-between border border-purple-200/60 shadow-inner">
                        <div>
                          <h5 className="font-bold text-xs tracking-wider text-purple-900 uppercase mb-1">
                            Your Custom Gift Hamper
                          </h5>
                          <p className="text-[9px] text-purple-900/60 font-light mb-2.5">
                            Rigid lavender box & custom gold card included
                          </p>

                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {selectedHamperProducts.length === 0 ? (
                              <span className="text-[9px] text-purple-900/40 italic">
                                Select items below to fill your box...
                              </span>
                            ) : (
                              selectedHamperProducts.map((id) => {
                                const name =
                                  id === 1
                                    ? "Almonds"
                                    : id === 2
                                    ? "Pistachios"
                                    : id === 3
                                    ? "Cashews"
                                    : id === 4
                                    ? "Dates"
                                    : id === 5
                                    ? "Figs"
                                    : id === 6
                                    ? "Raisins"
                                    : "Makhana";
                                return (
                                  <span
                                    key={id}
                                    className="px-2 py-0.5 bg-purple-100/60 border border-purple-200/40 text-[9px] font-semibold rounded-md text-purple-800"
                                  >
                                    ✓ {name}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>

                        <div className="border-t border-purple-200/10 pt-2 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400">Rigid Box: Waived!</span>
                          <span className="font-extrabold text-xs sm:text-sm text-purple-955">
                            Total: ₹
                            {selectedHamperProducts.reduce((sum, id) => {
                              const price =
                                id === 1
                                  ? 279
                                  : id === 2
                                  ? 399
                                  : id === 3
                                  ? 299
                                  : id === 4
                                  ? 289
                                  : id === 5
                                  ? 379
                                  : id === 6
                                  ? 169
                                  : 249;
                              return sum + price;
                            }, 0)}
                          </span>
                        </div>
                      </div>

                      {/* Products List & Button */}
                      <div className="md:col-span-7 flex flex-col justify-between gap-3">
                        <div className="space-y-1 max-h-[140px] overflow-y-auto border border-purple-200/40 p-2 rounded-xl bg-white">
                          {[
                            { id: 1, name: "Premium California Almonds", price: 279 },
                            { id: 2, name: "Saffron Pistachios", price: 399 },
                            { id: 3, name: "Royal Cashews W320", price: 299 },
                            { id: 4, name: "Medjool Dates", price: 289 },
                            { id: 5, name: "Turkish Figs", price: 379 },
                            { id: 6, name: "Jumbo Raisins", price: 169 },
                            { id: 7, name: "Fox Nuts (Makhana)", price: 249 },
                          ].map((item) => {
                            const isSelected = selectedHamperProducts.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedHamperProducts(
                                      selectedHamperProducts.filter((id) => id !== item.id)
                                    );
                                  } else {
                                    setSelectedHamperProducts([...selectedHamperProducts, item.id]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex justify-between items-center text-[11px] sm:text-xs ${
                                  isSelected
                                    ? "bg-purple-100/40 border-purple-400/50"
                                    : "bg-white border-stone-200 hover:border-purple-500/20"
                                }`}
                              >
                                <span className="font-semibold text-slate-800">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">₹{item.price}</span>
                                  <div
                                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                      isSelected
                                        ? "bg-purple-700 border-purple-700 text-white"
                                        : "border-stone-300"
                                    }`}
                                  >
                                    {isSelected && <Check className="w-2 h-2" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={handleAddHamperToCart}
                          disabled={selectedHamperProducts.length === 0 || hamperAddedStatus}
                          className={`w-full py-2 rounded-xl font-bold text-[11px] sm:text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                            hamperAddedStatus
                              ? "bg-emerald-600 text-white"
                              : selectedHamperProducts.length === 0
                              ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                              : "bg-[#3d1a5c] hover:bg-[#28113e] text-white"
                          }`}
                        >
                          {hamperAddedStatus ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Hamper Added to Cart!
                            </>
                          ) : (
                            <>
                              <Gift className="w-3.5 h-3.5" /> Add Custom Hamper to Cart
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Flow Area (larger readable font) */}
          <div
            className="flex-grow overflow-y-auto p-5 md:p-7 flex flex-col space-y-5"
            data-lenis-prevent
            style={{ backgroundColor: 'rgba(248, 245, 255, 0.45)' }}
          >
            {messages.length === 1 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center my-auto max-w-xl mx-auto px-4 py-6">
                <div className="mb-2 flex items-center justify-center">
                  <img
                    src="/kalindi.png"
                    alt="Kalindi Logo"
                    className="w-64 h-24 object-contain"
                  />
                </div>
                
                <p
                  className="text-base md:text-[17px] text-purple-900/80 font-light leading-relaxed mb-8 max-w-md"
                  dangerouslySetInnerHTML={{
                    __html: applyInlineMarkdown(
                      "I am your **Personal Shopper**. How may I tailor your dry fruit selection, craft a bespoke hamper, or evaluate your wellness needs today?"
                    ),
                  }}
                />

                <div className="w-full space-y-4">
                  <p className="text-[10px] text-purple-900/40 font-bold uppercase tracking-wider">
                    Suggested Conversations
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip.query)}
                        className="px-4 py-3 rounded-2xl border border-purple-200 bg-white text-xs font-semibold text-purple-900 hover:bg-[#3d1a5c] hover:border-[#3d1a5c] hover:text-white transition-all duration-300 shadow-3xs hover:-translate-y-0.5 hover:shadow-xs cursor-pointer text-center flex items-center justify-center"
                      >
                        {chip.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 md:p-5 border shadow-sm text-left ${
                      msg.role === "user"
                        ? "border-purple-200 text-purple-950 rounded-br-none font-medium"
                        : "border-purple-100 rounded-bl-none text-slate-800"
                    }`}
                    style={{
                      backgroundColor: msg.role === "user" ? "rgba(237,233,254,0.9)" : "rgba(255,255,255,0.95)"
                    }}
                  >
                    {msg.role === "user" ? (
                      <p className="text-base md:text-[17px] font-medium leading-relaxed text-purple-950">
                        {msg.content}
                      </p>
                    ) : (
                      renderMessageContent(msg.content)
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/85 border border-purple-200/40 rounded-2xl rounded-bl-none p-4 max-w-[80%] flex items-center gap-2.5 shadow-xs backdrop-blur-md">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-700" />
                  <span className="text-sm text-slate-500 font-medium">
                    Personal Shopper is curating recommendations...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel Footer */}
          <div className="p-4 border-t border-purple-200/50 flex items-center gap-3 shrink-0 shadow-sm" style={{ backgroundColor: 'white' }}>
            <div className="flex-grow relative flex items-center">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputVal)}
                placeholder="Ask about dry fruits, custom recipe dose, health benefits..."
                className="w-full border border-purple-200 rounded-2xl py-3.5 pl-4 pr-12 text-base md:text-[17px] text-purple-950 placeholder-purple-400 focus:outline-hidden focus:border-purple-500 transition-colors shadow-inner"
                style={{ backgroundColor: '#fafafa' }}
              />
              <button
                onClick={toggleListening}
                type="button"
                title={isListening ? "Listening..." : "Dictate Voice"}
                className={`absolute right-4 p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? "text-red-500 bg-red-100 hover:bg-red-200 animate-pulse"
                    : "text-purple-600 hover:bg-purple-50"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => handleSendMessage(inputVal)}
              disabled={!inputVal.trim() || isLoading}
              className="w-12 h-12 rounded-2xl text-white flex items-center justify-center transition-all shrink-0 hover:scale-105 cursor-pointer disabled:cursor-not-allowed shadow-md"
              style={{
                backgroundColor: (!inputVal.trim() || isLoading) ? '#d1d5db' : '#5b21b6',
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}


