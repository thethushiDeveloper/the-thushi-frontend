import React, { createContext, useContext, useState, useEffect } from 'react';
import { getImageUrl } from '../utils/api';

const NotepadContext = createContext();

const STORAGE_KEY = 'thethushi_notepad_items';

const createEmptyItem = () => ({
  id: Date.now() + Math.random(),
  itemNo: '',
  name: '',
  quantity: 1,
  description: '',
  image: '',
  weightRange: '',
  metal: ''
});

export const NotepadProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load notepad from storage', e);
    }
    return [createEmptyItem()];
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save notepad items', e);
    }
  }, [items]);

  // Add product to notepad (like cart)
  const addToNotepad = (product, openModal = true) => {
    if (!product) return;

    const itemNumber = (product.itemNumber || product.itemNo || '').toString().trim();
    const productName = product.name || '';
    
    // Resolve primary image full URL
    let imgUrl = '';
    if (product.images && product.images.length > 0) {
      imgUrl = getImageUrl(product.images[0]);
    } else if (product.image) {
      imgUrl = getImageUrl(product.image);
    }

    const weightRange = product.weightRange || '';
    const metal = product.metal || 'Gold';

    setItems((prevItems) => {
      // Check if product already exists in notepad
      const existingIndex = prevItems.findIndex(
        (it) => it.itemNo && it.itemNo.trim().toLowerCase() === itemNumber.toLowerCase()
      );

      if (existingIndex !== -1) {
        // Increment quantity of existing item
        const updated = [...prevItems];
        const currentQty = parseInt(updated[existingIndex].quantity, 10) || 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + 1,
          image: updated[existingIndex].image || imgUrl,
          name: updated[existingIndex].name || productName,
          weightRange: updated[existingIndex].weightRange || weightRange,
          metal: updated[existingIndex].metal || metal,
        };
        return updated;
      }

      // If there is only one empty item, replace it
      if (prevItems.length === 1 && (!prevItems[0].itemNo || !prevItems[0].itemNo.trim())) {
        return [{
          id: Date.now(),
          itemNo: itemNumber,
          name: productName,
          quantity: 1,
          description: '',
          image: imgUrl,
          weightRange,
          metal
        }];
      }

      // Otherwise append new item to notepad
      return [
        ...prevItems,
        {
          id: Date.now(),
          itemNo: itemNumber,
          name: productName,
          quantity: 1,
          description: '',
          image: imgUrl,
          weightRange,
          metal
        }
      ];
    });

    if (openModal) {
      setIsOpen(true);
    }
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const updateQuantity = (id, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const current = parseInt(item.quantity, 10) || 1;
        const nextQty = Math.max(1, current + delta);
        return { ...item, quantity: nextQty };
      })
    );
  };

  const removeItem = (id) => {
    setItems((prev) => {
      if (prev.length <= 1) {
        return [createEmptyItem()];
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearAll = () => {
    setItems([createEmptyItem()]);
  };

  const addEmptyRow = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  // Valid items count
  const validItems = items.filter((it) => it.itemNo && it.itemNo.trim() !== '');
  const totalItemsCount = validItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 1), 0);

  return (
    <NotepadContext.Provider
      value={{
        isOpen,
        setIsOpen,
        items,
        addToNotepad,
        updateItem,
        updateQuantity,
        removeItem,
        clearAll,
        addEmptyRow,
        validItemsCount: validItems.length,
        totalItemsCount,
      }}
    >
      {children}
    </NotepadContext.Provider>
  );
};

export const useNotepad = () => {
  const context = useContext(NotepadContext);
  if (!context) {
    throw new Error('useNotepad must be used within a NotepadProvider');
  }
  return context;
};
