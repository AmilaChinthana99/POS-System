import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [overallDiscountPercent, setOverallDiscountPercent] = useState(0);
  const [overallDiscountAmount, setOverallDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        // Check stock threshold warning limit
        if (newQty > product.stockQuantity) {
          alert(`Warning: Requested quantity (${newQty}) exceeds current stock level (${product.stockQuantity})`);
        }
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          ...product,
          quantity,
          discountPercent: 0,
          unitPrice: product.sellingPrice,
        },
      ];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const updateItemDiscount = (productId, discountPercent) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, discountPercent: Math.min(100, Math.max(0, discountPercent)) } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setOverallDiscountPercent(0);
    setOverallDiscountAmount(0);
    setNotes('');
  };

  // Compute live cart totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalItemDiscounts = 0;
    let totalTax = 0;

    const items = cartItems.map((item) => {
      const qty = item.quantity || 1;
      const price = item.sellingPrice || item.unitPrice || 0;
      const discPct = item.discountPercent || 0;
      const taxRate = item.taxRate !== undefined ? item.taxRate : 8.0;

      const rawSubtotal = price * qty;
      const itemDisc = (rawSubtotal * discPct) / 100;
      const itemNet = rawSubtotal - itemDisc;
      const itemTax = (itemNet * taxRate) / 100;

      subtotal += rawSubtotal;
      totalItemDiscounts += itemDisc;
      totalTax += itemTax;

      return {
        ...item,
        itemDiscount: itemDisc,
        itemNetSubtotal: itemNet,
        itemTax,
        itemTotal: itemNet + itemTax,
      };
    });

    let totalDiscount = totalItemDiscounts;
    if (overallDiscountPercent > 0) {
      totalDiscount += ((subtotal - totalItemDiscounts) * overallDiscountPercent) / 100;
    } else if (overallDiscountAmount > 0) {
      totalDiscount += Number(overallDiscountAmount);
    }

    const netSubtotal = Math.max(0, subtotal - totalDiscount);
    const grandTotal = netSubtotal + totalTax;

    return {
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal: Math.max(0, grandTotal),
      itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
      processedCartItems: items,
    };
  }, [cartItems, overallDiscountPercent, overallDiscountAmount]);

  const loadParkedSale = (heldSale) => {
    setCartItems(
      heldSale.items.map((item) => ({
        id: item.productId,
        name: item.productName,
        sellingPrice: item.unitPrice,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        quantity: item.quantity,
        taxRate: item.taxRate,
        discountPercent: item.discountAmount > 0 ? (item.discountAmount / (item.unitPrice * item.quantity)) * 100 : 0,
      }))
    );
    if (heldSale.customer) setSelectedCustomer(heldSale.customer);
    setOverallDiscountAmount(heldSale.discountAmount || 0);
    setNotes(heldSale.notes || '');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedCustomer,
        setSelectedCustomer,
        overallDiscountPercent,
        setOverallDiscountPercent,
        overallDiscountAmount,
        setOverallDiscountAmount,
        notes,
        setNotes,
        addToCart,
        updateQuantity,
        updateItemDiscount,
        removeFromCart,
        clearCart,
        totals,
        loadParkedSale,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
