import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, ArrowLeft, X, Copy, Check } from 'lucide-react';
import api, { BASE_URL } from '../utils/api';
import './ItemDetail.css';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [settings, setSettings] = useState({ phoneNumber: '', whatsappNumber: '' });
  const [mainImage, setMainImage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [itemNoCopied, setItemNoCopied] = useState(false);

  const handleCopyItemNo = () => {
    navigator.clipboard.writeText(item.itemNumber);
    setItemNoCopied(true);
    setTimeout(() => setItemNoCopied(false), 2000);
  };
  
  const phoneNumbers = settings.phoneNumber ? settings.phoneNumber.split(',').map(n => n.trim()).filter(n => n) : [];

  useEffect(() => {
    fetchItem();
    fetchSettings();
  }, [id]);

  const fetchItem = async () => {
    try {
      const { data } = await api.get(`/items/${id}`);
      setItem(data);
      if (data.images && data.images.length > 0) {
        setMainImage(`${BASE_URL}${data.images[0]}`);
      }
    } catch (error) {
      console.error('Failed to load item detail');
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
    } catch (error) {
      console.error('Settings error');
    }
  };

  if (!item) return <div className="loading">Loading...</div>;

  const handleWhatsApp = () => {
    const text = `Hello, I am interested in Item No: #${item.itemNumber} from ${settings.siteTitle || 'The Thushi'}.\n\nName: ${item.name}\nWeight: ${item.weightRange}`;
    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCallClick = () => {
    if (phoneNumbers.length === 1) {
      window.location.href = `tel:${phoneNumbers[0]}`;
    } else if (phoneNumbers.length > 1) {
      setShowCallMenu(!showCallMenu);
    }
  };



  return (
    <div className="item-detail-container animate-fade-in">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Back to Catalog
      </button>

      <div className="item-detail-grid">
        <div className="item-gallery">
          <motion.div
            className="main-image-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={mainImage}
            onClick={() => setIsZoomed(true)}
          >
            <img src={mainImage} alt={item.name} className="main-image" />
          </motion.div>
          <div className="thumbnail-list">
            {item.images.map((img, i) => (
              <div
                key={i}
                className={`thumbnail ${mainImage === `${BASE_URL}${img}` ? 'active' : ''}`}
                onClick={() => setMainImage(`${BASE_URL}${img}`)}
              >
                <img src={`${BASE_URL}${img}`} alt={`Thumbnail ${i}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="item-info">
          <h1>{item.name}</h1>
          <div
            className="sku-badge badge-copyable"
            onClick={handleCopyItemNo}
            title="Click to copy item number"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {itemNoCopied ? <Check size={14} /> : <Copy size={14} />}
            Item No: <span>{item.itemNumber}</span>
            {itemNoCopied && <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.85rem' }}>Copied!</span>}
          </div>

          <div className="details-section">
            <p className="weight"><strong>Weight Range:</strong> {item.weightRange}</p>
            <p className="category"><strong>Category:</strong> {item.category}</p>
            <p className="category"><strong>Metal:</strong> {item.metal || 'Gold'}</p>
          </div>

          <div className="description">
            <h3>Description</h3>
            <p>{item.description || "An exquisitely crafted piece from our premium collection, designed to resonate with timeless elegance."}</p>
          </div>

          <div className="action-buttons" style={{ flexWrap: 'wrap', position: 'relative' }}>
            {phoneNumbers.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button className="btn btn-primary call-btn" onClick={handleCallClick}>
                  <Phone size={20} /> Call Now
                </button>
                {showCallMenu && (
                  <div className="call-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', zIndex: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                    {phoneNumbers.map((num, idx) => (
                      <button key={idx} onClick={() => window.location.href = `tel:${num}`} style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', padding: '0.5rem', cursor: 'pointer', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-color)'}>
                         <Phone size={14} style={{ marginRight: '8px' }}/> {num}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className="btn whatsapp-btn" onClick={handleWhatsApp}>
              <MessageCircle size={20} /> WhatsApp Chat
            </button>
          </div>

          <div className="trust-badges">
            <p>100% Authentic Jewellery</p>
            <p>Certified Craftsmanship</p>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div className="zoom-modal" onClick={() => setIsZoomed(false)}>
          <button className="close-zoom" onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}>
            <X size={32} />
          </button>
          <img src={mainImage} alt={item.name} className="zoomed-image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
