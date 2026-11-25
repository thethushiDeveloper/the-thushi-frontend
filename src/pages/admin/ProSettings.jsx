import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Plus, Trash2, ArrowLeft, Eye, EyeOff, 
  Image as ImageIcon, Save, CheckCircle
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

  // Existing slides in DB
  const [existingSlides, setExistingSlides] = useState([]);
  
  // New slides pending upload: { file, preview, title, subtitle, description, badge }
  const [newSlides, setNewSlides] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
    } else {
      fetchSettings();
    }
  }, [navigate]);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data) {
        setProBannerVisible(data.proBannerVisible !== false);
        setProBannerTitle(data.proBannerTitle || 'New Variety Creations');
        setProBannerSubtitle(data.proBannerSubtitle || 'Exclusive Designs Handcrafted for Premium Jewellers');
        setExistingSlides(data.proAdSlides || []);
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
          badge: 'New Variety'
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

    // Retained existing slides
    formData.append('retainedProAdSlides', JSON.stringify(existingSlides));

    // New slides files & meta
    if (newSlides.length > 0) {
      const meta = newSlides.map(s => ({
        title: s.title || '',
        subtitle: s.subtitle || '',
        description: s.description || '',
        badge: s.badge || 'New Variety'
      }));
      formData.append('newProAdSlidesMeta', JSON.stringify(meta));
      newSlides.forEach(s => {
        formData.append('proAdImages', s.file);
      });
    }

    try {
      const { data } = await api.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Pro Collection settings & ad photos saved successfully!');
      if (data) {
        setExistingSlides(data.proAdSlides || []);
        setNewSlides([]);
      }
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Error saving pro settings:', err);
      setError('Failed to save settings. Please try again.');
      setTimeout(() => setError(''), 4000);
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
