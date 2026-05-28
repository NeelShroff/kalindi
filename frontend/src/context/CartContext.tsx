"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  cart_item_id: string; // compound key: `${product_id}-${weight}`
  id: number;           // database product id
  name: string;
  weight: string;       // "250g", "500g", or "1000g"
  price: number;
  quantity: number;
  image_url: string | null;
  color: string | null;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any, weight: string, price: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("kalindi_cart");
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("kalindi_cart", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [cartItems, isLoaded]);

  const addToCart = (product: any, weight: string, price: number) => {
    const cartItemId = `${product.id}-${weight}`;
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.cart_item_id === cartItemId);
      if (existingItem) {
        return prevItems.map((item) =>
          item.cart_item_id === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      const newItem: CartItem = {
        cart_item_id: cartItemId,
        id: product.id,
        name: product.name,
        weight,
        price,
        quantity: 1,
        image_url: product.image_url,
        color: product.color,
      };
      return [...prevItems, newItem];
    });
    // Automatically open the cart drawer when an item is added
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.cart_item_id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cart_item_id === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
