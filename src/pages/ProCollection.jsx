import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Lock, KeyRound, User, ChevronLeft, ChevronRight, 
  Search, Copy, Check, ShoppingBag, LogOut, ArrowRight, X, 
  Layers, Gem, Award, ShieldCheck, Eye, EyeOff, Store, Phone,
  PackageCheck
} from 'lucide-react';
import { useNotepad } from '../context/NotepadContext';
import api, { getImageUrl } from '../utils/api';
import './ProCollection.css';

const ProCollection = () => {
  const { addToNotepad } = useNotepad();

  // Auth State
  const [jeweller, setJeweller] = useState(() => {
    try {
      const stored = localStorage.getItem('jewellerInfo');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Pro Items & Categories State
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('category'); // 'category' (grouped) or 'grid'
  const [onlyAvailableStock, setOnlyAvailableStock] = useState(false); // Toggle "Available Stock"

  // Settings & Ad Slides State
  const [settings, setSettings] = useState(null);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  // Interaction State
  const [copiedId, setCopiedId] = useState(null);
  const [addedId, setAddedId] = useState(null);
  const [zoomModalImg, setZoomModalImg] = useState(null);

  // Check login on mount and load settings
  useEffect(() => {
    fetchSettings();
    if (jeweller) {
      fetchProItems();
      fetchCategories();
    }
  }, [jeweller?._id]);

  // Auto-play for Variety Photos Ad Showcase
  useEffect(() => {
    const slides = settings?.proAdSlides || [];
    if (slides.length <= 1 || isSlidePaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIdx(prev => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [settings?.proAdSlides, isSlidePaused]);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProItems = async () => {
    try {
      // Query pro items and any in-stock standard items for Pro Collection members
      const { data } = await api.get('/items?forPro=true');
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load pro items:', err);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const { data } = await api.post('/jewellers/login', {
        loginId: loginId.trim(),
        password: password.trim()
      });

      localStorage.setItem('jewellerToken', data.token);
      localStorage.setItem('jewellerInfo', JSON.stringify(data));
      setJeweller(data);
      window.dispatchEvent(new Event('jewellerAuthChange'));

      // Fetch pro collection data immediately (including in-stock items)
      const itemsRes = await api.get('/items?forPro=true');
      setItems(itemsRes.data || []);
      const catsRes = await api.get('/categories');
      setCategories(catsRes.data || []);
    } catch (err) {
      console.error('Pro collection login error:', err);
      setAuthError(err.response?.data?.message || 'Invalid Login ID or Password. Please contact admin.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Do you want to log out from the Pro Collection?')) {
      localStorage.removeItem('jewellerToken');
      localStorage.removeItem('jewellerInfo');
      setJeweller(null);
      setLoginId('');
      setPassword('');
      window.dispatchEvent(new Event('jewellerAuthChange'));
    }
  };

  const handleCopyItemNo = (e, itemNumber, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(itemNumber);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddToOrder = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    addToNotepad(item, true);
    setAddedId(item._id);
    setTimeout(() => setAddedId(null), 2000);
  };

  // Filter and sort items
  const filteredItems = items.filter(item => {
    // Available Stock toggle: if ON, only show ready-made available items
    if (onlyAvailableStock && !item.inStock) {
      return false;
    }

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'sku') return a.itemNumber.localeCompare(b.itemNumber);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Group items category-wise
  const categoryGroups = categories.reduce((acc, cat) => {
    const groupItems = filteredItems.filter(i => i.category === cat.name);
    if (groupItems.length > 0) {
      acc.push({
        category: cat.name,
        isProCategory: cat.isPro,
        items: groupItems
      });
    }
    return acc;
  }, []);

  // Items whose category is not listed in categories table
  const uncategorizedItems = filteredItems.filter(
    item => !categories.some(cat => cat.name === item.category)
  );
  if (uncategorizedItems.length > 0) {
    categoryGroups.push({
      category: 'Special Varieties',
      isProCategory: true,
      items: uncategorizedItems
    });
  }

  const proSlides = (settings?.proAdSlides || []).filter(s => s.image);
  const showBanner = settings?.proBannerVisible !== false && proSlides.length > 0;

  // ─────────────────────────────────────────────────────────────
  // 1. RENDER LOGIN SCREEN (if not authenticated)
  // ─────────────────────────────────────────────────────────────
  if (!jeweller) {
    return (
      <div className="pro-page-container animate-fade-in">
        <div className="pro-login-wrapper">
          <motion.div 
            className="pro-login-card"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="pro-login-icon">
              <Sparkles size={32} />
            </div>

            <h1 className="pro-login-title">Pro Collection</h1>
            <p className="pro-login-subtitle">
              Exclusive portal reserved for authorized jewellers. Please enter the Login ID and Password provided by admin.
            </p>

            {authError && (
              <motion.div 
                className="error-message" 
                style={{ textAlign: 'left', marginBottom: '1.2rem', fontSize: '0.9rem' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                {authError}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="pro-login-form">
              <div className="pro-form-group">
                <label>Jeweller Login ID</label>
                <div className="pro-input-wrap">
                  <User className="input-icon" size={18} />
                  <input 
                    type="text" 
                    placeholder="Enter your assigned Login ID"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="pro-form-group">
                <label>Password</label>
                <div className="pro-input-wrap">
                  <KeyRound className="input-icon" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter your assigned password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="pro-pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="pro-btn-submit"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Unlock Pro Collection</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="pro-login-footer-note">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px', color: 'var(--primary-color)' }}>
                <ShieldCheck size={16} />
                <span style={{ fontWeight: 600 }}>Authorized Jeweller Access Only</span>
              </div>
              <p style={{ margin: 0 }}>
                If you are a jeweller and do not have login credentials yet, please contact The Thushi admin to get your personal access.
              </p>
              {settings?.phoneNumber && (
                <p style={{ marginTop: '6px', color: 'var(--text-color)', fontWeight: 600 }}>
                  Helpline: {settings.phoneNumber.split(',')[0]}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. RENDER AUTHENTICATED PRO COLLECTION CATALOG
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="pro-page-container animate-fade-in">
      {/* Required Personalized Greeting Header */}
      <motion.div 
        className="pro-welcome-header"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="pro-greeting-title">
            Hello <span className="pro-greeting-jeweller-name">{jeweller.name}</span>, here is pro collection of the thushi for you
          </h1>
          <div className="pro-greeting-subtitle">
            <span className="pro-user-pill">
              <Store size={14} /> Jeweller ID: {jeweller.loginId}
            </span>
            {jeweller.mobile && (
              <span className="pro-user-pill">
                <Phone size={14} /> {jeweller.mobile}
              </span>
            )}
            <span style={{ color: 'var(--primary-color)', fontSize: '0.85rem' }}>
              ✦ VIP Catalog Access Enabled
            </span>
          </div>
        </div>

        <button 
          type="button" 
          className="pro-btn-logout" 
          onClick={handleLogout}
          title="Sign out of Pro Collection"
        >
          <LogOut size={16} /> Exit Pro Portal
        </button>
      </motion.div>

      {/* ─── RUN AD OF NEW VARIETY ITEMS PHOTO (Managed from Pro Settings) ─── */}
      {showBanner && proSlides.length > 0 && (
        <motion.div 
          className="pro-ad-showcase"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          onMouseEnter={() => setIsSlidePaused(true)}
          onMouseLeave={() => setIsSlidePaused(false)}
        >
          <div className="pro-ad-header">
            <h3>
              <Sparkles size={20} />
              <span>{settings.proBannerTitle || 'New Variety Creations'}</span>
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #aaa)', fontStyle: 'italic' }}>
              {settings.proBannerSubtitle || 'Exclusive Preview for Premium Jewellers'}
            </span>
          </div>

          <div className="pro-ad-slide-content">
            <div 
              className="pro-ad-img-box" 
              onClick={() => setZoomModalImg(getImageUrl(proSlides[currentSlideIdx].image))}
              style={{ cursor: 'zoom-in' }}
              title="Click to view full image"
            >
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentSlideIdx}
                  src={getImageUrl(proSlides[currentSlideIdx].image)} 
                  alt={proSlides[currentSlideIdx].title || 'New Variety Jewelry'}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </AnimatePresence>
            </div>

            <div className="pro-ad-text-box">
              <span className="pro-ad-badge">
                {proSlides[currentSlideIdx].badge || 'New Variety'}
              </span>
              
              <h2 className="pro-ad-title">
                {proSlides[currentSlideIdx].title || 'Exclusive Masterpiece Creation'}
              </h2>

              {proSlides[currentSlideIdx].subtitle && (
                <div className="pro-ad-subtitle">
                  {proSlides[currentSlideIdx].subtitle}
                </div>
              )}

              {proSlides[currentSlideIdx].description && (
                <p className="pro-ad-desc">
                  {proSlides[currentSlideIdx].description}
                </p>
              )}

              <div className="pro-ad-nav-btns">
                <button 
                  type="button" 
                  className="pro-ad-nav-arrow"
                  onClick={() => setCurrentSlideIdx((currentSlideIdx - 1 + proSlides.length) % proSlides.length)}
                  title="Previous Variety"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  type="button" 
                  className="pro-ad-nav-arrow"
                  onClick={() => setCurrentSlideIdx((currentSlideIdx + 1) % proSlides.length)}
                  title="Next Variety"
                >
                  <ChevronRight size={20} />
                </button>

                <div className="pro-ad-dots">
                  {proSlides.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`pro-ad-dot ${idx === currentSlideIdx ? 'active' : ''}`}
                      onClick={() => setCurrentSlideIdx(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── BEST CATALOG DESIGN FOR PRO COLLECTION (CATEGORY-WISE) ─── */}
      <div className="pro-catalog-section-title">
        <div>
          <h2>
            <Gem size={26} />
            <span>Pro Collection Catalog</span>
          </h2>
          <p>
            Browse handpicked luxury jewellery curated category-wise for {jeweller.name}.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--card-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setViewMode('category')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'category' ? 'var(--primary-color)' : 'transparent',
              color: viewMode === 'category' ? '#000' : 'var(--text-color)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={15} /> Category View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'grid' ? 'var(--primary-color)' : 'transparent',
              color: viewMode === 'grid' ? '#000' : 'var(--text-color)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>All Items Grid</span>
          </button>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="pro-category-pills">
        <button 
          type="button"
          className={`pro-cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          <span>All Pro Items</span>
          <span className="pro-cat-count">{onlyAvailableStock ? items.filter(i => i.inStock).length : items.length}</span>
        </button>
        {categories.map((cat, idx) => {
          const count = items.filter(i => i.category === cat.name && (!onlyAvailableStock || i.inStock)).length;
          return (
            <button
              key={idx}
              type="button"
              className={`pro-cat-pill ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <span>{cat.name}</span>
              <span className="pro-cat-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Sort Bar */}
      <div className="pro-controls-bar">
        <div className="pro-search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search pro collection by name, SKU or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Toggle Button for Available Stock (Only for Pro Collection members) */}
        <div className="pro-stock-toggle-wrap">
          <button
            type="button"
            className={`pro-stock-toggle-btn ${onlyAvailableStock ? 'active' : ''}`}
            onClick={() => setOnlyAvailableStock(prev => !prev)}
            title={onlyAvailableStock ? "Showing ready-made available stock only. Click to show all designs." : "Click to view ready-made available stock items only."}
          >
            <div className="stock-toggle-switch">
              <span className="stock-toggle-thumb" />
            </div>
            <div className="stock-toggle-label">
              <span className="stock-toggle-title">
                <PackageCheck size={16} /> Available Stock
              </span>
              <span className="stock-toggle-sub">
                {onlyAvailableStock 
                  ? `Showing Ready Items (${items.filter(i => i.inStock).length})` 
                  : `Show Ready Items Only`}
              </span>
            </div>
          </button>
        </div>

        <div className="pro-sort-box">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Sort by: Newest Arrivals</option>
            <option value="name">Sort by: Name (A-Z)</option>
            <option value="sku">Sort by: Item SKU</option>
          </select>
        </div>
      </div>

      {/* Available Stock Active Notice Banner */}
      {onlyAvailableStock && (
        <div className="pro-stock-notice-bar animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageCheck size={18} color="#22c55e" />
            <span>
              <strong>Available Stock filter is ON:</strong> Showing only ready-made items currently in stock ({filteredItems.length} found).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOnlyAvailableStock(false)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(34, 197, 94, 0.6)',
              borderRadius: '20px',
              color: '#22c55e',
              padding: '0.25rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Show All Designs
          </button>
        </div>
      )}

      {/* ─── CATALOG DISPLAY: CATEGORY-WISE OR UNIFIED GRID ─── */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <Sparkles size={48} style={{ color: 'var(--primary-color)', opacity: 0.6, marginBottom: '1rem' }} />
          <h3>
            {onlyAvailableStock 
              ? 'No Ready Stock Items Found' 
              : 'No Pro Items Found Matching Your Search'}
          </h3>
          <p style={{ color: 'var(--text-muted, #888)', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            {onlyAvailableStock
              ? 'There are currently no ready-made items in stock matching your current filters. Turn off "Available Stock" to explore all custom made-to-order designs.'
              : 'Try selecting another category or clear your search term.'}
          </p>
          {onlyAvailableStock && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setOnlyAvailableStock(false)}
            >
              Turn Off Available Stock & View All Designs
            </button>
          )}
        </div>
      ) : viewMode === 'category' && selectedCategory === 'all' ? (
        /* Category-Wise Grouped Display */
        <div>
          {categoryGroups.map((group, gIdx) => (
            <section key={gIdx} className="pro-category-group">
              <div className="pro-category-group-header">
                <h3>
                  <Sparkles size={20} />
                  <span>{group.category}</span>
                </h3>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted, #888)' }}>
                  {group.items.length} {group.items.length === 1 ? 'Design' : 'Designs'} Available
                </span>
              </div>

              <div className="pro-catalog-grid">
                {group.items.map((item, itemIdx) => (
                  <motion.div 
                    key={item._id}
                    className="pro-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(itemIdx * 0.04, 0.4) }}
                  >
                    {item.isPro ? (
                      <span className="pro-card-badge">
                        <Sparkles size={12} /> PRO EXCLUSIVE
                      </span>
                    ) : (
                      <span className="pro-card-badge" style={{ background: 'linear-gradient(135deg, #15803d, #166534)', color: '#fff' }}>
                        <PackageCheck size={12} /> AVAILABLE IN STOCK
                      </span>
                    )}
                    {item.inStock && (
                      <span className="pro-card-stock-pill" title="Ready made item available in stock">
                        <PackageCheck size={12} /> Ready Stock
                      </span>
                    )}

                    <div 
                      className="pro-card-img-wrap"
                      onClick={() => setZoomModalImg(item.images[0] ? getImageUrl(item.images[0]) : '')}
                    >
                      <img 
                        className="bg-blur"
                        src={item.images[0] ? getImageUrl(item.images[0]) : 'https://via.placeholder.com/300x400?text=Pro+Item'} 
                        alt=""
                        aria-hidden="true"
                      />
                      <img 
                        className="main-img"
                        src={item.images[0] ? getImageUrl(item.images[0]) : 'https://via.placeholder.com/300x400?text=Pro+Item'} 
                        alt={item.name} 
                        loading="lazy"
                      />
                    </div>

                    <div className="pro-card-body">
                      <h4 className="pro-card-title">{item.name}</h4>

                      <span 
                        className="pro-card-sku" 
                        onClick={(e) => handleCopyItemNo(e, item.itemNumber, item._id)}
                        title="Click to copy SKU"
                      >
                        {copiedId === item._id ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                        <span>SKU: {item.itemNumber}</span>
                        {copiedId === item._id && <span style={{ color: '#22c55e', fontWeight: 700 }}>Copied!</span>}
                      </span>

                      <div className="pro-card-specs">
                        <span><strong>Weight:</strong> {item.weightRange}</span>
                        <span><strong>Metal:</strong> {item.metal || 'Gold'}</span>
                        <span>
                          <strong>Stock:</strong>{' '}
                          {item.inStock ? (
                            <span style={{ color: '#22c55e', fontWeight: 700 }}>Ready in Stock</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted, #888)' }}>Made to Order</span>
                          )}
                        </span>
                      </div>

                      <div className="pro-card-actions">
                        <button
                          type="button"
                          className={`pro-btn-order ${addedId === item._id ? 'added' : ''}`}
                          onClick={(e) => handleAddToOrder(e, item)}
                        >
                          {addedId === item._id ? (
                            <><Check size={16} /> Added to Order Bag!</>
                          ) : (
                            <><ShoppingBag size={16} /> Add for Order</>
                          )}
                        </button>
                        <Link to={`/item/${item._id}`} className="pro-btn-view">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Unified Grid Display */
        <div className="pro-catalog-grid">
          {filteredItems.map((item, itemIdx) => (
            <motion.div 
              key={item._id}
              className="pro-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(itemIdx * 0.04, 0.4) }}
            >
              {item.isPro ? (
                <span className="pro-card-badge">
                  <Sparkles size={12} /> PRO EXCLUSIVE
                </span>
              ) : (
                <span className="pro-card-badge" style={{ background: 'linear-gradient(135deg, #15803d, #166534)', color: '#fff' }}>
                  <PackageCheck size={12} /> AVAILABLE IN STOCK
                </span>
              )}
              {item.inStock && (
                <span className="pro-card-stock-pill" title="Ready made item available in stock">
                  <PackageCheck size={12} /> Ready Stock
                </span>
              )}

              <div 
                className="pro-card-img-wrap"
                onClick={() => setZoomModalImg(item.images[0] ? getImageUrl(item.images[0]) : '')}
              >
                <img 
                  className="bg-blur"
                  src={item.images[0] ? getImageUrl(item.images[0]) : 'https://via.placeholder.com/300x400?text=Pro+Item'} 
                  alt=""
                  aria-hidden="true"
                />
                <img 
                  className="main-img"
                  src={item.images[0] ? getImageUrl(item.images[0]) : 'https://via.placeholder.com/300x400?text=Pro+Item'} 
                  alt={item.name} 
                  loading="lazy"
                />
              </div>

              <div className="pro-card-body">
                <h4 className="pro-card-title">{item.name}</h4>

                <span 
                  className="pro-card-sku" 
                  onClick={(e) => handleCopyItemNo(e, item.itemNumber, item._id)}
                  title="Click to copy SKU"
                >
                  {copiedId === item._id ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                  <span>SKU: {item.itemNumber}</span>
                  {copiedId === item._id && <span style={{ color: '#22c55e', fontWeight: 700 }}>Copied!</span>}
                </span>

                <div className="pro-card-specs">
                  <span><strong>Weight:</strong> {item.weightRange}</span>
                  <span><strong>Metal:</strong> {item.metal || 'Gold'}</span>
                  <span>
                    <strong>Stock:</strong>{' '}
                    {item.inStock ? (
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>Ready in Stock</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted, #888)' }}>Made to Order</span>
                    )}
                  </span>
                </div>

                <div className="pro-card-actions">
                  <button
                    type="button"
                    className={`pro-btn-order ${addedId === item._id ? 'added' : ''}`}
                    onClick={(e) => handleAddToOrder(e, item)}
                  >
                    {addedId === item._id ? (
                      <><Check size={16} /> Added to Order Bag!</>
                    ) : (
                      <><ShoppingBag size={16} /> Add for Order</>
                    )}
                  </button>
                  <Link to={`/item/${item._id}`} className="pro-btn-view">
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomModalImg && (
        <div className="zoom-modal" onClick={() => setZoomModalImg(null)}>
          <button className="close-zoom" onClick={(e) => { e.stopPropagation(); setZoomModalImg(null); }}>
            <X size={32} />
          </button>
          <img src={zoomModalImg} alt="Zoomed View" className="zoomed-image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ProCollection;
