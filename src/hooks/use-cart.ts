import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  price_estimate: number | null;
  purchase_url: string | null;
  brand_suggestion: string | null;
  schoolId: string;
  schoolName: string;
  gradeName: string;
}

const CART_KEY = "listinha_cart";

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // Persist to localStorage whenever items change
  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Check if item already exists
      if (prev.some((i) => i.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback((itemId: string) => {
    return items.some((i) => i.id === itemId);
  }, [items]);

  const toggleItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  const totalItems = items.length;
  
  const totalEstimate = items.reduce((sum, item) => {
    return sum + (item.price_estimate || 0) * (item.quantity || 1);
  }, 0);

  const itemsWithPurchaseUrl = items.filter((i) => i.purchase_url);

  return {
    items,
    addItem,
    removeItem,
    clearCart,
    isInCart,
    toggleItem,
    totalItems,
    totalEstimate,
    itemsWithPurchaseUrl,
  };
}
