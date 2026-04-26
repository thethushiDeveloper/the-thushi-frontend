import React, { useState, useEffect } from 'react';
import { ClipboardEdit, X, Plus, Trash2, Send, Copy, Eraser } from 'lucide-react';
import api from '../utils/api';
import './FloatingNotepad.css';

const FloatingNotepad = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([{ id: Date.now(), itemNo: '', quantity: '', description: '' }]);
  const [settings, setSettings] = useState({ whatsappNumber: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings for notepad');
      }
    };
    fetchSettings();

    const handleSettingsUpdate = () => fetchSettings();
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), itemNo: '', quantity: '', description: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDeleteAll = () => {
    setItems([{ id: Date.now(), itemNo: '', quantity: '', description: '' }]);
  };

  const generateMessage = () => {
    const validItems = items.filter(item => item.itemNo.trim() !== '');
    if (validItems.length === 0) return '';

    let message = "Hello, I would like to place an order for the following items:\n\n";
    validItems.forEach((item, index) => {
      let descStr = item.description ? ` - Desc: ${item.description.trim()}` : '';
      message += `${index + 1}. Item No: ${item.itemNo} - Quantity: ${item.quantity || 1}${descStr}\n`;
    });
    message += "\nThank you!";
    return message;
  };

  const handleCopy = () => {
    const msg = generateMessage();
    if (!msg) return alert('Please add at least one item.');
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const msg = generateMessage();
    if (!msg) return alert('Please add at least one item.');
    
    // Default to a fallback number if none is set in admin
    let phoneNum = settings.whatsappNumber ? settings.whatsappNumber.replace(/[^0-9]/g, '') : '919359758554';
    
    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="floating-notepad-wrapper">
      {isOpen ? (
        <div className="notepad-modal">
          <div className="notepad-header">
            <h3>Quick Order Notepad</h3>
            <div className="notepad-header-actions">
              <button
                className="delete-all-btn"
                onClick={handleDeleteAll}
                title="Delete all items"
              >
                <Eraser size={16} /> Clear All
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="notepad-body">
            <div className="notepad-list">
              {items.map((item, index) => (
                <div key={item.id} className="notepad-item-container">
                  <div className="notepad-item-row">
                    <span className="row-number">{index + 1}.</span>
                    <input
                      type="text"
                      placeholder="Item No."
                      value={item.itemNo}
                      onChange={(e) => handleItemChange(item.id, 'itemNo', e.target.value)}
                      className="notepad-input item-no-input"
                    />
                    <input
                      type="text"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="notepad-input qty-input"
                    />
                    <button 
                      className="delete-row-btn" 
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="notepad-item-row notepad-item-desc-row">
                    <input
                      type="text"
                      placeholder="Description (Optional)"
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="notepad-input desc-input"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <button className="add-row-btn" onClick={handleAddItem}>
              <Plus size={16} /> Add Another Item
            </button>
          </div>

          <div className="notepad-footer">
            <button className="action-btn copy-btn" onClick={handleCopy}>
              <Copy size={16} /> {copied ? 'Copied!' : 'Copy List'}
            </button>
            <button className="action-btn whatsapp-btn" onClick={handleSendWhatsApp}>
              <Send size={16} /> WhatsApp
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="floating-btn" 
          onClick={() => setIsOpen(true)}
          title="Open Order Notepad"
        >
          <ClipboardEdit size={24} />
        </button>
      )}
    </div>
  );
};

export default FloatingNotepad;
