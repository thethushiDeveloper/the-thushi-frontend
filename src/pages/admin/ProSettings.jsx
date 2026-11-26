import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Plus, Trash2, ArrowLeft, Eye, EyeOff, 
  Image as ImageIcon, Save, CheckCircle, Clock, Zap, Video
} from 'lucide-react';
import api, { getImageUrl } from '../../utils/api';
import './Admin.css';

const ProSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Pro Banner & Ads State
  const [proBannerVisible, setProBannerVisible] = useState(true);
  const [proBannerTitle, setProBannerTitle] = useState('New Variety Creations');
  const [proBannerSubtitle, setProBannerSubtitle] = useState('Exclusive Designs Handcrafted for Premium Jewellers');
  const [proBannerSlideSpeed, setProBannerSlideSpeed] = useState(5);
  const [proBannerLayout, setProBannerLayout] = useState('split'); // 'split' or 'full'

  // Welcome Video State
  const [proWelcomeVideoEnabled, setProWelcomeVideoEnabled] = useState(true);
  const [existingWelcomeVideo, setExistingWelcomeVideo] = useState('');
  const [newWelcomeVideoFile, setNewWelcomeVideoFile] = useState(null);
  const [newWelcomeVideoPreview, setNewWelcomeVideoPreview] = useState('');
  const [deleteWelcomeVideo, setDeleteWelcomeVideo] = useState(false);

  // Existing slides in DB
  const [existingSlides, setExistingSlides] = useState([]);
  
  // New slides pending upload: { file, preview, title, subtitle, description, badge, itemNumber }
  const [newSlides, setNewSlides] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
    } else {
      fetchSettings();
      api.get('/items?admin=true').then(res => setAvailableItems(res.data || [])).catch(() => {});
    }
  }, [navigate]);

  const getLocalExtraConfig = () => {
    try {
      return JSON.parse(localStorage.getItem('proBannerExtraConfig') || '{}');
    } catch {
      return {};
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data) {
        const localCfg = getLocalExtraConfig();
        const itemNums = localCfg.slideItemNumbers || {};
        setProBannerVisible(data.proBannerVisible !== false);
        setProBannerTitle(data.proBannerTitle || 'New Variety Creations');
        setProBannerSubtitle(data.proBannerSubtitle || 'Exclusive Designs Handcrafted for Premium Jewellers');
        setProBannerSlideSpeed(data.proBannerSlideSpeed !== undefined ? Number(data.proBannerSlideSpeed) : 5);
        const resolvedLayout = data.proBannerLayout || localCfg.proBannerLayout || 'split';
        setProBannerLayout(resolvedLayout === 'full' ? 'full' : 'split');
        setProWelcomeVideoEnabled(data.proWelcomeVideoEnabled !== false);
        setExistingWelcomeVideo(data.proWelcomeVideo || '');
        setNewWelcomeVideoFile(null);
        setNewWelcomeVideoPreview('');
        setDeleteWelcomeVideo(false);
        const mergedSlides = (data.proAdSlides || []).map(s => ({
          ...s,
          itemNumber: s.itemNumber || itemNums[s._id] || itemNums[s.image] || ''
        }));
        setExistingSlides(mergedSlides);
        setNewSlides([]);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Could not load Pro Collection settings.');
    }
  };

  const handleNewFiles = (files) => {
    const arr = Array.from(files);
    arr.forEach(file => {
      const preview = URL.createObjectURL(file);
      setNewSlides(prev => [
        ...prev,
        {
          file,
          preview,
          title: '',
          subtitle: '',
          description: '',
          badge: 'New Variety',
          itemNumber: ''
        }
      ]);
    });
  };

  const removeNewSlide = (idx) => {
    setNewSlides(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const updateNewSlide = (idx, field, value) => {
    setNewSlides(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const removeExistingSlide = (slideId) => {
    setExistingSlides(prev => prev.filter(s => s._id !== slideId));
  };

  const updateExistingSlide = (slideId, field, value) => {
    setExistingSlides(prev => prev.map(s => s._id === slideId ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('proBannerVisible', proBannerVisible);
    formData.append('proBannerTitle', proBannerTitle);
    formData.append('proBannerSubtitle', proBannerSubtitle);
    formData.append('proBannerSlideSpeed', proBannerSlideSpeed);
    formData.append('proBannerLayout', proBannerLayout);
    formData.append('proWelcomeVideoEnabled', proWelcomeVideoEnabled);
    if (deleteWelcomeVideo) {
      formData.append('deleteProWelcomeVideo', 'true');
    }
    if (newWelcomeVideoFile) {
      formData.append('proWelcomeVideo', newWelcomeVideoFile);
    }

    // Retained existing slides
    formData.append('retainedProAdSlides', JSON.stringify(existingSlides));

    // New slides files & meta
    if (newSlides.length > 0) {
      const meta = newSlides.map(s => ({
        title: s.title || '',
        subtitle: s.subtitle || '',
        description: s.description || '',
        badge: s.badge || 'New Variety',
        itemNumber: s.itemNumber || ''
      }));
      formData.append('newProAdSlidesMeta', JSON.stringify(meta));
      newSlides.forEach(s => {
        formData.append('proAdImages', s.file);
      });
    }

    try {
      const { data } = await api.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000
      });
      setMessage('Pro Collection settings & ad photos saved successfully!');

      // Build itemNumber map from what admin just submitted so it never gets wiped
      const submittedItemNums = {};
      existingSlides.forEach(s => {
        if (s.itemNumber) {
          if (s._id) submittedItemNums[s._id] = s.itemNumber;
          if (s.image) submittedItemNums[s.image] = s.itemNumber;
        }
      });

      const returnedSlides = (data?.proAdSlides || existingSlides).map((s, idx) => {
        // Also match newly added slides by tail index if backend returned them
        const newIdx = idx - existingSlides.length;
        const newSlideNum = newIdx >= 0 && newSlides[newIdx] ? newSlides[newIdx].itemNumber : '';
        const resolvedNum = s.itemNumber || submittedItemNums[s._id] || submittedItemNums[s.image] || newSlideNum || '';
        if (resolvedNum) {
          if (s._id) submittedItemNums[s._id] = resolvedNum;
          if (s.image) submittedItemNums[s.image] = resolvedNum;
        }
        return { ...s, itemNumber: resolvedNum };
      });

      const resolvedLayout = (data?.proBannerLayout === 'full' || data?.proBannerLayout === 'split')
        ? data.proBannerLayout
        : proBannerLayout;

      // Persist fallback config in localStorage for instant sync across tabs
      localStorage.setItem('proBannerExtraConfig', JSON.stringify({
        proBannerLayout: resolvedLayout,
        slideItemNumbers: submittedItemNums
      }));

      setExistingSlides(returnedSlides);
      setProBannerLayout(resolvedLayout);
      setNewSlides([]);
      if (data?.proWelcomeVideo !== undefined) {
        setExistingWelcomeVideo(data.proWelcomeVideo || '');
      }
      if (newWelcomeVideoPreview) {
        URL.revokeObjectURL(newWelcomeVideoPreview);
      }
      setNewWelcomeVideoFile(null);
      setNewWelcomeVideoPreview('');
      setDeleteWelcomeVideo(false);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Error saving pro settings:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save settings. Please try again.';
      setError(`Failed to save: ${errMsg}`);
      setTimeout(() => setError(''), 6000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/dashboard" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <div className="admin-header">
        <h1>Pro Collection Settings</h1>
        <p>Manage new variety items ad showcase, photos, and banners running in the exclusive Pro Collection.</p>
      </div>

      {message && <div className="status-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        {/* Banner Visibility & Controls */}
        <div className="form-section" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <Sparkles size={24} style={{ color: 'var(--primary-color)' }} />
            <h2 style={{ margin: 0 }}>New Variety Showcase Ad Banner</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>Showcase Status:</span>
            <button
              type="button"
              onClick={() => setProBannerVisible(!proBannerVisible)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '0.4rem 1.2rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.9rem',
                background: proBannerVisible ? '#22c55e' : '#ef4444',
                color: '#fff',
                transition: 'background 0.2s',
              }}
            >
              {proBannerVisible ? <><Eye size={16}/> Active & Running</> : <><EyeOff size={16}/> Hidden</>}
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)' }}>
              {proBannerVisible ? 'New variety photo ads will run automatically in Pro Collection.' : 'Ad banner is paused / hidden from jewellers.'}
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Showcase Headline</label>
              <input 
                type="text" 
                value={proBannerTitle} 
                onChange={(e) => setProBannerTitle(e.target.value)} 
                placeholder="e.g. New Variety Creations"
              />
            </div>
            <div className="form-group">
              <label>Showcase Subtitle</label>
              <input 
                type="text" 
                value={proBannerSubtitle} 
                onChange={(e) => setProBannerSubtitle(e.target.value)} 
                placeholder="e.g. Exclusive Designs Handcrafted for Premium Jewellers"
              />
            </div>
          </div>

          {/* Ad Banner Photo Changing Speed Setting */}
          <div style={{
            marginTop: '1.2rem',
            padding: '1.2rem',
            background: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--primary-color)' }} />
                <label style={{ margin: 0, fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>
                  Photo Changing Speed (Ad Banner Slideshow)
                </label>
              </div>
              <span style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--primary-color)',
                color: 'var(--primary-color)',
                padding: '0.2rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                Every {proBannerSlideSpeed} seconds ({proBannerSlideSpeed * 1000}ms)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
              <input 
                type="range" 
                min="2" 
                max="15" 
                step="1"
                value={proBannerSlideSpeed}
                onChange={(e) => setProBannerSlideSpeed(Number(e.target.value))}
                style={{ flex: 1, minWidth: '180px', accentColor: 'var(--primary-color)', margin: 0, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="number" 
                  min="2" 
                  max="30"
                  value={proBannerSlideSpeed}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1) setProBannerSlideSpeed(val);
                  }}
                  style={{ width: '70px', padding: '0.4rem', textAlign: 'center', margin: 0, fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>sec</span>
              </div>
            </div>

            {/* Speed Presets */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>Quick Presets:</span>
              {[
                { label: '3s (Fast)', val: 3 },
                { label: '5s (Standard)', val: 5 },
                { label: '7s (Luxury)', val: 7 },
                { label: '10s (Relaxed)', val: 10 }
              ].map(p => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setProBannerSlideSpeed(p.val)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.78rem',
                    borderRadius: '16px',
                    border: '1px solid ' + (proBannerSlideSpeed === p.val ? 'var(--primary-color)' : 'var(--border-color)'),
                    background: proBannerSlideSpeed === p.val ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                    color: proBannerSlideSpeed === p.val ? 'var(--primary-color)' : 'var(--text-color)',
                    cursor: 'pointer',
                    fontWeight: proBannerSlideSpeed === p.val ? 700 : 500,
                    transition: 'all 0.2s'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <small style={{ color: 'var(--text-muted, #888)', display: 'block', marginTop: '0.6rem', fontSize: '0.8rem' }}>
              The Pro Collection ad showcase will automatically rotate to the next photo according to this timing. Jewellers can also hover to pause or click navigation arrows manually.
            </small>
          </div>

          {/* Ad Banner Layout Mode (2 Options) */}
          <div style={{
            marginTop: '1.2rem',
            padding: '1.2rem',
            background: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px'
          }}>
            <label style={{ margin: '0 0 0.8rem', display: 'block', fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>
              Ad Banner Image & Text Layout
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setProBannerLayout('split')}
                style={{
                  textAlign: 'left',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '2px solid ' + (proBannerLayout === 'split' ? 'var(--primary-color)' : 'var(--border-color)'),
                  background: proBannerLayout === 'split' ? 'rgba(212, 175, 55, 0.12)' : 'var(--card-bg)',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 700, color: proBannerLayout === 'split' ? 'var(--primary-color)' : 'var(--text-color)', marginBottom: '0.3rem' }}>
                  Option 1: Split Layout (Default)
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #888)', lineHeight: 1.4 }}>
                  Photo on the left side and text + Inspect button on the right side.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProBannerLayout('full')}
                style={{
                  textAlign: 'left',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '2px solid ' + (proBannerLayout === 'full' ? 'var(--primary-color)' : 'var(--border-color)'),
                  background: proBannerLayout === 'full' ? 'rgba(212, 175, 55, 0.12)' : 'var(--card-bg)',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 700, color: proBannerLayout === 'full' ? 'var(--primary-color)' : 'var(--text-color)', marginBottom: '0.3rem' }}>
                  Option 2: Full Banner Overlay
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #888)', lineHeight: 1.4 }}>
                  Photo fills the entire ad banner box with text overlaid on top of the image.
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Existing Variety Item Photos */}
        <div className="form-section" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ImageIcon size={24} style={{ color: 'var(--primary-color)' }} />
              <h2 style={{ margin: 0 }}>Current Variety Item Photos ({existingSlides.length})</h2>
            </div>
          </div>

          {existingSlides.length === 0 ? (
            <p style={{ color: 'var(--text-muted, #888)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
              No variety item photos active. Upload photos below to run in the Pro Collection ad showcase.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem' }}>
              {existingSlides.map((slide, idx) => (
                <div key={slide._id || idx} style={{
                  display: 'flex',
                  gap: '1.2rem',
                  padding: '1.2rem',
                  background: 'var(--bg-color)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img 
                      src={getImageUrl(slide.image)} 
                      alt={`Variety item ${idx + 1}`} 
                      style={{ height: '110px', width: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingSlide(slide._id)}
                      style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        background: '#ef4444', color: '#fff', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Remove this photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem', minWidth: '240px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>Badge / Tag</label>
                      <input 
                        type="text" 
                        placeholder="e.g. New Variety, Hot Design"
                        value={slide.badge || ''}
                        onChange={(e) => updateExistingSlide(slide._id, 'badge', e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>Item / Design Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Royal Antique Thushi Choker"
                        value={slide.title || ''}
                        onChange={(e) => updateExistingSlide(slide._id, 'title', e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>Subtitle / Purity / Spec</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 22K Hallmarked Gold, 35g"
                        value={slide.subtitle || ''}
                        onChange={(e) => updateExistingSlide(slide._id, 'subtitle', e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>Highlight Note</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Special handcrafted filigree work"
                        value={slide.description || ''}
                        onChange={(e) => updateExistingSlide(slide._id, 'description', e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600 }}>Item Number / SKU (Click Redirect)</label>
                      <input 
                        type="text" 
                        list="pro-item-sku-list"
                        placeholder="e.g. TH-104 (opens item details on click)"
                        value={slide.itemNumber || ''}
                        onChange={(e) => updateExistingSlide(slide._id, 'itemNumber', e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending New Slides */}
          {newSlides.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: '0.8rem' }}>
                New Variety Photos to Add ({newSlides.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {newSlides.map((slide, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    gap: '1.2rem',
                    padding: '1.2rem',
                    background: 'var(--bg-color)',
                    borderRadius: '8px',
                    border: '1px dashed var(--primary-color)',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img 
                        src={slide.preview} 
                        alt={`New photo ${idx + 1}`} 
                        style={{ height: '110px', width: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewSlide(idx)}
                        style={{
                          position: 'absolute', top: '-8px', right: '-8px',
                          background: '#ef4444', color: '#fff', border: 'none',
                          borderRadius: '50%', width: '24px', height: '24px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem', minWidth: '240px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>Badge / Tag</label>
                        <input 
                          type="text" 
                          placeholder="e.g. New Variety"
                          value={slide.badge}
                          onChange={(e) => updateNewSlide(idx, 'badge', e.target.value)}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>Item / Design Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Designer Thushi Kada"
                          value={slide.title}
                          onChange={(e) => updateNewSlide(idx, 'title', e.target.value)}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>Subtitle / Purity / Spec</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 22K Yellow Gold"
                          value={slide.subtitle}
                          onChange={(e) => updateNewSlide(idx, 'subtitle', e.target.value)}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>Highlight Note</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Latest trending bridal piece"
                          value={slide.description}
                          onChange={(e) => updateNewSlide(idx, 'description', e.target.value)}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600 }}>Item Number / SKU (Click Redirect)</label>
                        <input 
                          type="text" 
                          list="pro-item-sku-list"
                          placeholder="e.g. TH-104 (opens item details on click)"
                          value={slide.itemNumber || ''}
                          onChange={(e) => updateNewSlide(idx, 'itemNumber', e.target.value)}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '1rem',
            background: 'var(--bg-color)',
            borderRadius: '8px',
            border: '1px dashed var(--border-color)',
            marginTop: '1rem'
          }}>
            <Plus size={22} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-color)', display: 'block', marginBottom: '0.3rem' }}>
                Add New Variety Item Photos
              </label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={(e) => handleNewFiles(e.target.files)}
                style={{ fontSize: '0.85rem' }}
              />
              <small style={{ color: 'var(--text-muted, #888)', display: 'block', marginTop: '0.3rem' }}>
                Select multiple high-resolution photos of your new jewellery varieties. They will rotate as featured ads in Pro Collection.
              </small>
            </div>
          </div>
        </div>

        {/* Pro Portal Welcome Video (Plays after Unlock Pro Catalog) */}
        <div className="form-section" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <Video size={24} style={{ color: 'var(--primary-color)' }} />
            <h2 style={{ margin: 0 }}>Pro Portal Welcome Video</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>Welcome Video Status:</span>
            <button
              type="button"
              onClick={() => setProWelcomeVideoEnabled(!proWelcomeVideoEnabled)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '0.4rem 1.2rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.9rem',
                background: proWelcomeVideoEnabled ? '#22c55e' : '#ef4444',
                color: '#fff',
                transition: 'background 0.2s',
              }}
            >
              {proWelcomeVideoEnabled ? <><Eye size={16}/> Enabled</> : <><EyeOff size={16}/> Disabled</>}
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)' }}>
              {proWelcomeVideoEnabled
                ? 'Plays automatically right after a jeweller clicks "Unlock Pro Catalog", then opens the catalog.'
                : 'Welcome video is disabled; jewellers enter the catalog directly.'}
            </span>
          </div>

          {(newWelcomeVideoPreview || (existingWelcomeVideo && !deleteWelcomeVideo)) && (
            <div style={{ marginBottom: '1.2rem', position: 'relative', background: '#000', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', maxWidth: '520px' }}>
              <video
                src={newWelcomeVideoPreview || getImageUrl(existingWelcomeVideo)}
                controls
                style={{ width: '100%', maxHeight: '280px', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newWelcomeVideoPreview) {
                    URL.revokeObjectURL(newWelcomeVideoPreview);
                    setNewWelcomeVideoPreview('');
                    setNewWelcomeVideoFile(null);
                  } else {
                    setDeleteWelcomeVideo(true);
                  }
                }}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: '#ef4444', color: '#fff', border: 'none',
                  borderRadius: '20px', padding: '0.35rem 0.8rem',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                <Trash2 size={14} /> Remove Video
              </button>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '1rem',
            background: 'var(--bg-color)',
            borderRadius: '8px',
            border: '1px dashed var(--border-color)'
          }}>
            <Video size={22} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-color)', display: 'block', marginBottom: '0.3rem' }}>
                Upload Welcome Video (MP4 / WebM / MOV)
              </label>
              <input 
                type="file" 
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (newWelcomeVideoPreview) URL.revokeObjectURL(newWelcomeVideoPreview);
                    setNewWelcomeVideoFile(file);
                    setNewWelcomeVideoPreview(URL.createObjectURL(file));
                    setDeleteWelcomeVideo(false);
                  }
                }}
                style={{ fontSize: '0.85rem' }}
              />
              <small style={{ color: 'var(--text-muted, #888)', display: 'block', marginTop: '0.3rem' }}>
                Recommended: Short 5–15 second luxury intro video. After it finishes playing, the Pro Collection opens automatically.
              </small>
            </div>
          </div>
        </div>

        <datalist id="pro-item-sku-list">
          {availableItems.map(item => (
            <option key={item._id} value={item.itemNumber}>
              {item.itemNumber} - {item.name}
            </option>
          ))}
        </datalist>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.8rem 2rem' }}
        >
          <Save size={18} /> {loading ? 'Saving Changes...' : 'Save Pro Collection Settings'}
        </button>
      </form>
    </div>
  );
};

export default ProSettings;
