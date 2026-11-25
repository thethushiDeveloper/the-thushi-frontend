import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Copy, 
  Eraser, 
  ExternalLink, 
  Maximize2 
} from 'lucide-react';
import { useNotepad } from '../context/NotepadContext';
import api from '../utils/api';
import './FloatingNotepad.css';

const FloatingNotepad = () => {
  const { 
    isOpen, 
    setIsOpen, 
    items, 
    updateItem, 
    updateQuantity, 
    removeItem, 
    clearAll, 
    addEmptyRow, 
    validItemsCount, 
    totalItemsCount 
  } = useNotepad();

  const [settings, setSettings] = useState({ whatsappNumber: '', siteTitle: 'The Thushi' });
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data) setSettings(data);
      } catch (error) {
        console.error('Error fetching settings for notepad');
      }
    };
    fetchSettings();

    const handleSettingsUpdate = (e) => {
      if (e.detail) setSettings(e.detail);
      else fetchSettings();
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const generateMessage = () => {
    const validItems = items.filter(item => item.itemNo && item.itemNo.toString().trim() !== '');
    if (validItems.length === 0) return '';

    let message = `*Order Inquiry - ${settings.siteTitle || 'The Thushi Jewellery'}*\n`;
    message += `Hello, I would like to place an order for the following ${validItems.length} item(s):\n\n`;

    validItems.forEach((item, index) => {
      message += `*${index + 1}. Item No: ${item.itemNo.toString().trim()}*\n`;
      if (item.name) message += `   • *Product:* ${item.name.trim()}\n`;
      message += `   • *Quantity:* ${item.quantity || 1}\n`;
      if (item.weightRange) message += `   • *Weight:* ${item.weightRange}\n`;
      if (item.metal) message += `   • *Metal:* ${item.metal}\n`;
      if (item.description && item.description.trim()) {
        message += `   • *Note:* ${item.description.trim()}\n`;
      }
      if (item.image) {
        // Direct image URL for WhatsApp link preview and instant verification
        message += `   • *Product Image:* ${item.image}\n`;
      }
      message += `\n`;
    });

    message += `Please confirm the price, availability, and delivery details.\nThank you!`;
    return message;
  };

  const handleCopy = () => {
    const msg = generateMessage();
    if (!msg) return alert('Please add at least one item with an item number.');
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const msg = generateMessage();
    if (!msg) return alert('Please add at least one item with an item number.');

    // Default to configured number or fallback
    let phoneNum = settings.whatsappNumber ? settings.whatsappNumber.replace(/[^0-9]/g, '') : '919359758554';
    if (!phoneNum.startsWith('91') && phoneNum.length === 10) {
      phoneNum = `91${phoneNum}`;
    }

    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="floating-notepad-wrapper">
      {isOpen ? (
        <div className="notepad-modal">
          <div className="notepad-header">
            <div className="notepad-title-group">
              <ShoppingBag size={20} className="notepad-header-icon" />
              <h3>Quick Order Notepad</h3>
              {validItemsCount > 0 && (
                <span className="notepad-count-pill">{totalItemsCount}</span>
              )}
            </div>
            <div className="notepad-header-actions">
              <button
                type="button"
                className="delete-all-btn"
                onClick={clearAll}
                title="Clear all items"
              >
                <Eraser size={14} /> Clear All
              </button>
              <button 
                type="button"
                className="close-btn" 
                onClick={() => setIsOpen(false)}
                title="Close notepad"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="notepad-body">
            <div className="notepad-list">
              {items.map((item, index) => (
                <div key={item.id} className="notepad-item-container">
                  <div className="notepad-item-main-row">
                    {/* Product Thumbnail */}
                    <div className="notepad-thumb-wrap">
                      {item.image ? (
                        <div 
                          className="notepad-thumb" 
                          onClick={() => setPreviewImage(item.image)}
                          title="Click to view full image"
                        >
                          <img src={item.image} alt={item.itemNo || 'Product'} />
                          <div className="thumb-zoom-icon">
                            <Maximize2 size={10} />
                          </div>
                        </div>
                      ) : (
                        <div className="notepad-thumb placeholder-thumb">
                          <span>#{index + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Inputs & Details */}
                    <div className="notepad-details-col">
                      <div className="notepad-inputs-row">
                        <input
                          type="text"
                          placeholder="Item No."
                          value={item.itemNo}
                          onChange={(e) => updateItem(item.id, 'itemNo', e.target.value)}
                          className="notepad-input item-no-input"
                        />

                        {/* Quantity Stepper */}
                        <div className="qty-stepper">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={(parseInt(item.quantity, 10) || 1) <= 1}
                            title="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="notepad-input qty-input"
                          />
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, 1)}
                            title="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Remove item button */}
                        <button
                          type="button"
                          className="delete-row-btn"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Product Name & Weight Subtitle */}
                      {(item.name || item.weightRange) && (
                        <div className="notepad-item-meta">
                          {item.name && <span className="meta-name">{item.name}</span>}
                          {item.weightRange && <span className="meta-weight">• {item.weightRange}</span>}
                        </div>
                      )}

                      {/* Description / Custom Note */}
                      <input
                        type="text"
                        placeholder="Add note (size, custom request, etc.)"
                        value={item.description || ''}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="notepad-input desc-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="add-row-btn" onClick={addEmptyRow}>
              <Plus size={16} /> Add Another Item
            </button>
          </div>

          <div className="notepad-footer">
            <button type="button" className="action-btn copy-btn" onClick={handleCopy}>
              <Copy size={16} /> {copied ? 'Copied!' : 'Copy List'}
            </button>
            <button type="button" className="action-btn whatsapp-btn" onClick={handleSendWhatsApp}>
              <Send size={16} /> Order on WhatsApp
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="floating-btn"
          onClick={() => setIsOpen(true)}
          title="Open Quick Order Notepad"
        >
          <ShoppingBag size={24} />
          {totalItemsCount > 0 && (
            <span className="floating-cart-badge">{totalItemsCount}</span>
          )}
        </button>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div className="notepad-image-modal" onClick={() => setPreviewImage(null)}>
          <div className="notepad-image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="notepad-image-close" 
              onClick={() => setPreviewImage(null)}
            >
              <X size={20} />
            </button>
            <img src={previewImage} alt="Order Product Preview" />
            <div className="image-modal-actions">
              <a 
                href={previewImage} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="view-full-link"
              >
                <ExternalLink size={14} /> Open Full Resolution
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingNotepad;