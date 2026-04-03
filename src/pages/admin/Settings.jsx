import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Eye, EyeOff, Image } from 'lucide-react';
import api, { getImageUrl } from '../../utils/api';
import './Admin.css';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ 
    phoneNumber: '', 
    whatsappNumber: '',
    heroSubtitle: '',
    aboutMode: 'text',
    logoDisplayMode: 'text',
    siteTitle: 'The Thushi',
    globalFont: 'Playfair Display',
    aboutText: '',
    address: '',
    facebookLink: '',
    instagramLink: '',
    jewelrySliderVisible: true,
  });
  
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  const [logo, setLogo] = useState(null);
  const [aboutImage, setAboutImage] = useState(null);
  const [sliders, setSliders] = useState([]);
  
  const [existingLogo, setExistingLogo] = useState('');
  const [deleteLogo, setDeleteLogo] = useState(false);
  
  const [existingAboutImage, setExistingAboutImage] = useState('');
  const [deleteAboutImage, setDeleteAboutImage] = useState(false);
  
  const [existingSliders, setExistingSliders] = useState([]);

  // --- Jewelry Slider State ---
  const [jewelrySlides, setJewelrySlides] = useState([]); // existing slides from DB
  const [newJewelrySlides, setNewJewelrySlides] = useState([]); // pending new slides: {file, preview, title, subtitle, description}
  
  const [message, setMessage] = useState('');

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
        setSettings({ 
          phoneNumber: data.phoneNumber || '', 
          whatsappNumber: data.whatsappNumber || '',
          heroSubtitle: data.heroSubtitle || '',
          aboutMode: data.aboutMode || 'text',
          logoDisplayMode: data.logoDisplayMode || 'text',
          siteTitle: data.siteTitle || 'The Thushi',
          globalFont: (data.globalFont || '').replace(/['"]/g, '') || 'Playfair Display',
          aboutText: data.aboutText || '',
          address: data.address || '',
          facebookLink: data.facebookLink || '',
          instagramLink: data.instagramLink || '',
          jewelrySliderVisible: data.jewelrySliderVisible !== false,
        });
        
        setExistingLogo(data.logo || '');
        setDeleteLogo(false);
        setLogo(null);
        
        setExistingAboutImage(data.aboutImage || '');
        setDeleteAboutImage(false);
        setAboutImage(null);

        setExistingSliders(data.sliders || []);
        setSliders([]);

        setJewelrySlides(data.jewelrySlides || []);
        setNewJewelrySlides([]);
      }
      
      const { data: catData } = await api.get('/categories');
      setCategories(catData || []);
    } catch (error) {
      console.error('Failed to fetch settings');
    }
  };

  const addCategory = async () => {
    if (newCategory.trim()) {
      try {
        await api.post('/categories', { name: newCategory.trim() });
        setNewCategory('');
        fetchSettings();
      } catch (err) { console.error('Error adding category:', err); }
    }
  };

  const removeCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      fetchSettings();
    } catch (err) { console.error('Error removing category:', err); }
  };

  const removeSlider = (sliderToRemove) => {
    setExistingSliders(existingSliders.filter(s => s !== sliderToRemove));
  };

  // --- Jewelry Slide Handlers ---
  const handleNewJewelrySlideImage = (files) => {
    const arr = Array.from(files);
    arr.forEach(file => {
      const preview = URL.createObjectURL(file);
      setNewJewelrySlides(prev => [
        ...prev,
        { file, preview, title: '', subtitle: '', description: '' }
      ]);
    });
  };

  const removeNewJewelrySlide = (idx) => {
    setNewJewelrySlides(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const updateNewJewelrySlide = (idx, field, value) => {
    setNewJewelrySlides(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const removeExistingJewelrySlide = (slideId) => {
    setJewelrySlides(prev => prev.filter(s => s._id !== slideId));
  };

  const updateExistingJewelrySlide = (slideId, field, value) => {
    setJewelrySlides(prev => prev.map(s => s._id === slideId ? { ...s, [field]: value } : s));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('phoneNumber', settings.phoneNumber);
      formData.append('whatsappNumber', settings.whatsappNumber);
      formData.append('heroSubtitle', settings.heroSubtitle);
      formData.append('aboutMode', settings.aboutMode);
      formData.append('logoDisplayMode', settings.logoDisplayMode);
      formData.append('siteTitle', settings.siteTitle);
      formData.append('globalFont', settings.globalFont);
      formData.append('aboutText', settings.aboutText);
      formData.append('address', settings.address);
      formData.append('facebookLink', settings.facebookLink);
      formData.append('instagramLink', settings.instagramLink);
      formData.append('jewelrySliderVisible', settings.jewelrySliderVisible ? 'true' : 'false');
      
      if (deleteLogo) formData.append('deleteLogo', 'true');
      if (logo) formData.append('logo', logo);

      if (deleteAboutImage) formData.append('deleteAboutImage', 'true');
      if (aboutImage) formData.append('aboutImage', aboutImage);

      formData.append('retainedSliders', JSON.stringify(existingSliders));
      if (sliders && sliders.length > 0) {
        Array.from(sliders).forEach(file => formData.append('sliders', file));
      }

      // Jewelry slides: retained existing (with updated meta) + new
      formData.append('retainedJewelrySlides', JSON.stringify(
        jewelrySlides.map(s => ({
          _id: s._id,
          title: s.title || '',
          subtitle: s.subtitle || '',
          description: s.description || '',
        }))
      ));

      if (newJewelrySlides.length > 0) {
        const meta = newJewelrySlides.map(s => ({
          title: s.title || '',
          subtitle: s.subtitle || '',
          description: s.description || '',
        }));
        formData.append('newJewelrySlidesMeta', JSON.stringify(meta));
        newJewelrySlides.forEach(s => formData.append('jewelrySlideImages', s.file));
      }

      const { data: updatedData } = await api.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Settings updated successfully!');
      
      // Update the font directly so the admin doesn't need to refresh
      if (settings.globalFont) {
        document.documentElement.style.setProperty('--global-font', settings.globalFont);
      }
      
      // Dispatch event with fresh data so Navbar/Footer update immediately
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: updatedData }));
      
      fetchSettings();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update settings');
    }
  };

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <h1>Platform Settings</h1>
        <p>Update contact info, website text, logo, sliders, and jewellery showcase.</p>
      </div>

      {message && <div className="status-message">{message}</div>}

      <div className="form-section">
        <form onSubmit={handleUpdate} className="admin-form">
          
          {/* Logo */}
          <div className="form-group">
            <label>Website Logo</label>
            {existingLogo && !deleteLogo && (
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                <img src={getImageUrl(existingLogo)} alt="Current Logo" style={{height: '50px'}}/>
                <button type="button" className="action-btn delete" onClick={() => setDeleteLogo(true)}><Trash2 size={16}/></button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={e => setLogo(e.target.files[0])} />
            <small>Upload new logo to replace the current one.</small>
          </div>

          <div className="form-group">
            <label>Website Name / Logo Display</label>
            <select value={settings.logoDisplayMode} onChange={e => setSettings({...settings, logoDisplayMode: e.target.value})}>
              <option value="text">Text Only</option>
              <option value="image">Image Only</option>
              <option value="both">Both Image and Text</option>
            </select>
            <small>Choose how the website name/brand should appear in the navigation bar.</small>
          </div>

          <div className="form-group">
            <label>Website Title</label>
            <input 
              type="text" 
              value={settings.siteTitle} 
              onChange={e => setSettings({...settings, siteTitle: e.target.value})} 
              placeholder="The Thushi" 
            />
          </div>

          <div className="form-group">
            <label>Global Font Family</label>
            <select value={settings.globalFont} onChange={e => setSettings({...settings, globalFont: e.target.value})}>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Cormorant Garamond">Cormorant Garamond</option>
              <option value="Marcellus">Marcellus</option>
              <option value="Outfit">Outfit</option>
              <option value="Cinzel">Cinzel</option>
            </select>
            <small>Changes the font style globally across the website.</small>
          </div>

          {/* Hero Sliders */}
          <div className="form-group">
            <label>Homepage Hero Sliders</label>
            {existingSliders.length > 0 && (
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px'}}>
                {existingSliders.map((img, idx) => (
                  <div key={idx} style={{position: 'relative'}}>
                    <img src={getImageUrl(img)} alt={`Slider ${idx}`} style={{height: '60px', borderRadius: '4px'}}/>
                    <button type="button" className="action-btn delete" style={{position: 'absolute', top: 0, right: 0, transform: 'translate(50%, -50%)', background: 'red', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.2rem'}} onClick={() => removeSlider(img)}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" multiple accept="image/*" onChange={e => setSliders(e.target.files)} />
          </div>

          {/* Hero Subtitle */}
          <div className="form-group">
            <label>Hero Subtitle</label>
            <input 
              type="text" 
              value={settings.heroSubtitle} 
              onChange={e => setSettings({...settings, heroSubtitle: e.target.value})} 
              placeholder="Exquisite Craftsmanship. Timeless Elegance." 
            />
          </div>

          {/* ─── JEWELLERY VOYAGE SLIDER ──────────────────── */}
          <div className="form-group" style={{borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem'}}>
            <label style={{fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Image size={18} /> Jewellery Showcase Slider
            </label>
            <small style={{display: 'block', marginBottom: '1rem', color: 'var(--text-muted, #888)'}}>
              This 3D voyage-style slider appears above the Featured Jewellery section on the homepage.
            </small>

            {/* Visibility toggle */}
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
              <span style={{color: 'var(--text-color)', fontWeight: 500}}>Slider Visibility:</span>
              <button
                type="button"
                onClick={() => setSettings(s => ({...s, jewelrySliderVisible: !s.jewelrySliderVisible}))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '0.4rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.9rem',
                  background: settings.jewelrySliderVisible ? '#22c55e' : '#ef4444',
                  color: '#fff',
                  transition: 'background 0.2s',
                }}
              >
                {settings.jewelrySliderVisible ? <><Eye size={16}/> Visible</> : <><EyeOff size={16}/> Hidden</>}
              </button>
              <span style={{fontSize: '0.8rem', color: 'var(--text-muted, #888)'}}>
                {settings.jewelrySliderVisible ? 'Slider is shown to visitors.' : 'Slider is hidden from visitors.'}
              </span>
            </div>

            {/* Existing slides */}
            {jewelrySlides.length > 0 && (
              <div style={{marginBottom: '1.5rem'}}>
                <p style={{fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.75rem'}}>Existing Slides ({jewelrySlides.length})</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {jewelrySlides.map((slide, idx) => (
                    <div key={slide._id} style={{display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap'}}>
                      <div style={{position: 'relative', flexShrink: 0}}>
                        <img
                          src={getImageUrl(slide.image)}
                          alt={`Slide ${idx + 1}`}
                          style={{height: '90px', width: '60px', objectFit: 'cover', borderRadius: '4px', display: 'block'}}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingJewelrySlide(slide._id)}
                          style={{position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '200px'}}>
                        <input
                          type="text"
                          placeholder="Title (e.g., Gold Necklace)"
                          value={slide.title || ''}
                          onChange={e => updateExistingJewelrySlide(slide._id, 'title', e.target.value)}
                          style={{padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)'}}
                        />
                        <input
                          type="text"
                          placeholder="Subtitle (e.g., 22K Gold)"
                          value={slide.subtitle || ''}
                          onChange={e => updateExistingJewelrySlide(slide._id, 'subtitle', e.target.value)}
                          style={{padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)'}}
                        />
                        <input
                          type="text"
                          placeholder="Description (e.g., Timeless elegance)"
                          value={slide.description || ''}
                          onChange={e => updateExistingJewelrySlide(slide._id, 'description', e.target.value)}
                          style={{padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)'}}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending new slides */}
            {newJewelrySlides.length > 0 && (
              <div style={{marginBottom: '1.5rem'}}>
                <p style={{fontWeight: 600, color: 'var(--primary-color)', marginBottom: '0.75rem'}}>New Slides to Add ({newJewelrySlides.length})</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {newJewelrySlides.map((slide, idx) => (
                    <div key={idx} style={{display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px dashed var(--primary-color)', flexWrap: 'wrap'}}>
                      <div style={{position: 'relative', flexShrink: 0}}>
                        <img
                          src={slide.preview}
                          alt={`New Slide ${idx + 1}`}
                          style={{height: '90px', width: '60px', objectFit: 'cover', borderRadius: '4px', display: 'block'}}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewJewelrySlide(idx)}
                          style={{position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '200px'}}>
                        <input
                          type="text"
                          placeholder="Title (e.g., Diamond Ring)"
                          value={slide.title}
                          onChange={e => updateNewJewelrySlide(idx, 'title', e.target.value)}
                          style={{padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)'}}
                        />
                        <input
                          type="text"
                          placeholder="Subtitle (e.g., Platinum Setting)"
                          value={slide.subtitle}
                          onChange={e => updateNewJewelrySlide(idx, 'subtitle', e.target.value)}
                          style={{padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)'}}
                        />
                        <input
                          type="text"
                          placeholder="Description (e.g., A perfect gift)"
                          value={slide.description}
                          onChange={e => updateNewJewelrySlide(idx, 'description', e.target.value)}
                          style={{padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)'}}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add slide images */}
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem 1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px dashed var(--border-color)'}}>
              <Plus size={18} style={{color: 'var(--primary-color)', flexShrink: 0}}/>
              <div style={{flex: 1}}>
                <label style={{fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-color)', display: 'block', marginBottom: '0.25rem'}}>
                  Add New Jewellery Slide Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => handleNewJewelrySlideImage(e.target.files)}
                  style={{fontSize: '0.85rem'}}
                />
                <small style={{color: 'var(--text-muted, #888)'}}>Select one or more images. You can fill in the title/subtitle after selecting.</small>
              </div>
            </div>
          </div>
          {/* ─────────────────────────────────────────────── */}

          {/* About Mode */}
          <div className="form-group">
            <label>About Us Section Mode</label>
            <select value={settings.aboutMode} onChange={e => setSettings({...settings, aboutMode: e.target.value})}>
              <option value="text">Rich Text / Description</option>
              <option value="image">Big Custom Image</option>
            </select>
          </div>

          {settings.aboutMode === 'text' && (
            <div className="form-group">
              <label>About Section Text</label>
              <textarea 
                value={settings.aboutText} 
                onChange={e => setSettings({...settings, aboutText: e.target.value})} 
                placeholder="Welcome to The Thushi. We provide the finest jewellery." 
                rows="4"
              />
            </div>
          )}

          {settings.aboutMode === 'image' && (
            <div className="form-group">
              <label>About Us Big Image</label>
              {existingAboutImage && !deleteAboutImage && (
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                  <img src={getImageUrl(existingAboutImage)} alt="About" style={{height: '100px'}}/>
                  <button type="button" className="action-btn delete" onClick={() => setDeleteAboutImage(true)}><Trash2 size={16}/></button>
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => setAboutImage(e.target.files[0])} />
            </div>
          )}

          {/* Address */}
          <div className="form-group">
            <label>Address (Optional)</label>
            <textarea 
              value={settings.address} 
              onChange={e => setSettings({...settings, address: e.target.value})} 
              placeholder="123 Jewelry Lane, City, Country" 
              rows="3"
            />
          </div>

          {/* Categories */}
          <div className="form-group">
            <label>Manage Categories</label>
             <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px'}}>
                {categories.map((cat, idx) => (
                  <div key={idx} style={{display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)'}}>
                    <span style={{marginRight: '10px', color: 'var(--text-color)'}}>{cat.name}</span>
                    <button type="button" style={{background:'transparent', border:'none', color:'#f87171', cursor:'pointer'}} onClick={() => removeCategory(cat._id)}><Trash2 size={16}/></button>
                  </div>
                ))}
             </div>
            <div style={{display: 'flex', gap: '10px'}}>
               <input 
                 type="text" 
                 value={newCategory} 
                 onChange={e => setNewCategory(e.target.value)} 
                 placeholder="New Category Name" 
               />
               <button type="button" className="btn btn-outline" style={{display: 'flex', alignItems: 'center', gap: '5px'}} onClick={addCategory}>
                 <Plus size={16} /> Add
               </button>
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone Numbers (comma separated)</label>
            <input 
              type="text" 
              value={settings.phoneNumber} 
              onChange={e => setSettings({...settings, phoneNumber: e.target.value})} 
              placeholder="+91 12345 67890, +91 98765 43210" 
              required 
            />
            <small>You can add multiple numbers separated by commas for calling.</small>
          </div>

          {/* WhatsApp */}
          <div className="form-group">
            <label>WhatsApp Number (Include Country Code, No spaces)</label>
            <input 
              type="text" 
              value={settings.whatsappNumber} 
              onChange={e => setSettings({...settings, whatsappNumber: e.target.value})} 
              placeholder="911234567890" 
              required 
            />
          </div>

          {/* Instagram */}
          <div className="form-group">
            <label>Instagram Link (Optional)</label>
            <input 
              type="url" 
              value={settings.instagramLink} 
              onChange={e => setSettings({...settings, instagramLink: e.target.value})} 
              placeholder="https://instagram.com/thethushi" 
            />
          </div>

          {/* Facebook */}
          <div className="form-group">
            <label>Facebook Link (Optional)</label>
            <input 
              type="url" 
              value={settings.facebookLink} 
              onChange={e => setSettings({...settings, facebookLink: e.target.value})} 
              placeholder="https://facebook.com/thethushi" 
            />
          </div>

          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
