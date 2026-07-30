import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  EMPTY_CART,
  fetchCart,
  addCartItem as apiAddItem,
  updateCartItem as apiUpdateItem,
  removeCartItem as apiRemoveItem,
  clearCart as apiClearCart,
} from "../api/cart.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchCart();
      setCart(data || EMPTY_CART);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load (or clear) the cart whenever auth state changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addItem(product) {
    // product is a product-service item; map to the cart payload shape.
    const updated = await apiAddItem({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: Number(product.price),
      imageUrl: product.image_url,
      quantity: 1,
    });
    setCart(updated);
    return updated;
  }

  async function updateQuantity(productId, quantity) {
    const updated = await apiUpdateItem(productId, quantity);
    setCart(updated);
    return updated;
  }

  async function removeItem(productId) {
    const updated = await apiRemoveItem(productId);
    setCart(updated);
    return updated;
  }

  async function clear() {
    await apiClearCart();
    setCart(EMPTY_CART);
  }

  const value = {
    cart,
    loading,
    count: cart?.totalQuantity || 0,
    refresh,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
