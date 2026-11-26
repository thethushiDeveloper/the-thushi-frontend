import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Lock, KeyRound, User, ChevronLeft, ChevronRight, 
  Search, Copy, Check, ShoppingBag, LogOut, ArrowRight, X, 
  Layers, Gem, Award, ShieldCheck, Eye, EyeOff, Store,
  PackageCheck, Maximize2, CheckCircle2, SlidersHorizontal,
  Flame, RefreshCw, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { useNotepad } from '../context/NotepadContext';
import api, { getImageUrl } from '../utils/api';
import './ProCollection.css';

// Elegant fallback SVG for jewellery images that fail to load
const JEWELRY_FALLBACK_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='100%25' height='100%25' fill='%23f9f9f9'/%3E%3Ccircle cx='200' cy='200' r='140' stroke='%23d4af37' stroke-width='1.5' fill='none' stroke-dasharray='4 4' opacity='0.4'/%3E%3Cpath d='M200 130 L235 180 L200 270 L165 180 Z' fill='none' stroke='%23d4af37' stroke-width='2' opacity='0.8'/%3E%3Cpath d='M165 180 L235 180 M200 130 L200 270' stroke='%23d4af37' stroke-width='1.5' opacity='0.6'/%3E%3Ccircle cx='200' cy='200' r='6' fill='%23d4af37'/%3E%3Ctext x='200' y='310' font-family='serif' font-size='14' fill='%238c6d23' text-anchor='middle' letter-spacing='3'%3ETHE THUSHI%3C/text%3E%3Ctext x='200' y='330' font-family='sans-serif' font-size='10' fill='%23999' text-anchor='middle' letter-spacing='1'%3EEXCLUSIVE CREATION%3C/text%3E%3C/svg%3E";

const ProCollection = () => {
  const navigate = useNavigate();
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
  const [viewMode, setViewMode] = useState('category'); // 'category' or 'grid'
  const [onlyAvailableStock, setOnlyAvailableStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Settings & Ad Slides State
  const [settings, setSettings] = useState(null);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);

  // Interaction State
  const [copiedId, setCopiedId] = useState(null);
  const [addedId, setAddedId] = useState(null);
  const [zoomModalImg, setZoomModalImg] = useState(null);
  const [zoomModalTitle, setZoomModalTitle] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Image load error trackers (prevents broken image icon)
  const [brokenImages, setBrokenImages] = useState({});

  // Slide animation direction (1 for next, -1 for prev)
  const [slideDirection, setSlideDirection] = useState(1);

  // Welcome Video Intro State (plays right after Unlock Pro Catalog)
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const welcomeVideoRef = useRef(null);

  // Load initial settings and items
  useEffect(() => {
    fetchSettings();
    if (jeweller) {
      loadProDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [jeweller?._id]);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data) {
        let localCfg = {};
        try {
          localCfg = JSON.parse(localStorage.getItem('proBannerExtraConfig') || '{}');
        } catch (_) {}
        const itemNums = localCfg.slideItemNumbers || {};
        const mergedSlides = (data.proAdSlides || []).map(s => ({
          ...s,
          itemNumber: s.itemNumber || itemNums[s._id] || itemNums[s.image] || ''
        }));
        setSettings({
          ...data,
          proBannerLayout: data.proBannerLayout || localCfg.proBannerLayout || 'split',
          proAdSlides: mergedSlides
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadProDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchProItems(), fetchCategories()]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
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
      const { data } = await api.get('/items?forPro=true');
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load pro items:', err);
    }
  };

  // Safe list of slides with valid images
  const proSlides = (settings?.proAdSlides || []).filter(
    s => s && s.image && typeof s.image === 'string' && s.image.trim().length > 0
  );

  // Slide speed in seconds (Configured manually by admin in Pro Settings)
  const slideSpeedSec = (settings?.proBannerSlideSpeed && Number(settings.proBannerSlideSpeed) >= 1)
    ? Number(settings.proBannerSlideSpeed)
    : 5;
  const slideSpeedMs = slideSpeedSec * 1000;

  // Auto-slide effect with progress tracking
  useEffect(() => {
    if (proSlides.length <= 1) {
      setSlideProgress(0);
      return;
    }

    if (currentSlideIdx >= proSlides.length) {
      setCurrentSlideIdx(0);
    }

    if (isSlidePaused) return;

    // Preload next image for seamless zero-flicker transition
    const nextIdx = (currentSlideIdx + 1) % proSlides.length;
    if (proSlides[nextIdx]?.image) {
      const preloadImg = new Image();
      preloadImg.src = getImageUrl(proSlides[nextIdx].image);
    }

    const intervalStep = 50;
    const totalSteps = slideSpeedMs / intervalStep;
    let stepCount = 0;

    const progressTimer = setInterval(() => {
      stepCount += 1;
      const pct = Math.min((stepCount / totalSteps) * 100, 100);
      setSlideProgress(pct);

      if (stepCount >= totalSteps) {
        clearInterval(progressTimer);
        setSlideDirection(1);
        setCurrentSlideIdx(prev => (prev + 1) % proSlides.length);
        setSlideProgress(0);
      }
    }, intervalStep);

    return () => {
      clearInterval(progressTimer);
    };
  }, [proSlides.length, currentSlideIdx, isSlidePaused, slideSpeedMs]);

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Ensure welcome video plays immediately when triggered
  useEffect(() => {
    if (!showWelcomeVideo || !welcomeVideoRef.current) return;
    const vid = welcomeVideoRef.current;
    vid.currentTime = 0;
    const playPromise = vid.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Fallback to muted autoplay if browser blocks unmuted playback
        setIsVideoMuted(true);
        vid.muted = true;
        vid.play().catch(() => {
          setShowWelcomeVideo(false);
        });
      });
    }
  }, [showWelcomeVideo]);

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

      // Check for welcome video before showing catalog
      let activeSettings = settings;
      if (!activeSettings) {
        try {
          const sRes = await api.get('/settings');
          activeSettings = sRes.data;
          setSettings(sRes.data);
        } catch (_) {}
      }

      const hasWelcomeVideo =
        activeSettings?.proWelcomeVideoEnabled !== false &&
        Boolean(activeSettings?.proWelcomeVideo && activeSettings.proWelcomeVideo.trim());

      if (hasWelcomeVideo) {
        setIsVideoMuted(false);
        setShowWelcomeVideo(true);
      }

      localStorage.setItem('jewellerToken', data.token);
      localStorage.setItem('jewellerInfo', JSON.stringify(data));
      setJeweller(data);
      window.dispatchEvent(new Event('jewellerAuthChange'));

      const [itemsRes, catsRes] = await Promise.all([
        api.get('/items?forPro=true'),
        api.get('/categories')
      ]);
      setItems(itemsRes.data || []);
      setCategories(catsRes.data || []);

      if (!hasWelcomeVideo) {
        showToast(`Welcome back, ${data.name}! VIP Access Granted.`);
      }
    } catch (err) {
      console.error('Pro collection login error:', err);
      setAuthError(err.response?.data?.message || 'Invalid Login ID or Password. Please contact admin.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Do you want to sign out from the Pro Collection portal?')) {
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
    showToast(`SKU ${itemNumber} copied!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddToOrder = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    addToNotepad(item, true);
    setAddedId(item._id);
    showToast(`"${item.name}" added to your Order Bag!`);
    setTimeout(() => setAddedId(null), 2200);
  };

  const handleNextSlide = () => {
    if (proSlides.length <= 1) return;
    setSlideDirection(1);
    setCurrentSlideIdx((currentSlideIdx + 1) % proSlides.length);
    setSlideProgress(0);
  };

  const handlePrevSlide = () => {
    if (proSlides.length <= 1) return;
    setSlideDirection(-1);
    setCurrentSlideIdx((currentSlideIdx - 1 + proSlides.length) % proSlides.length);
    setSlideProgress(0);
  };

  const handleSelectSlide = (idx) => {
    setSlideDirection(idx >= currentSlideIdx ? 1 : -1);
    setCurrentSlideIdx(idx);
    setSlideProgress(0);
  };

  const handleImageError = (idKey) => {
    setBrokenImages(prev => ({ ...prev, [idKey]: true }));
  };

  // Redirect to Item Details by itemNumber when clicking ad banner image or Inspect Design
  const handleSlideInspect = async (slide, slideIndex) => {
    const rawSku = slide?.itemNumber ? String(slide.itemNumber).trim() : '';
    if (rawSku) {
      const targetSku = rawSku.toLowerCase();
      let match = items.find(
        i => i.itemNumber && i.itemNumber.toLowerCase().trim() === targetSku
      );

      if (!match) {
        try {
          const { data } = await api.get(`/items/${encodeURIComponent(rawSku)}`);
          if (data && data._id) {
            match = data;
          }
        } catch (_) {
          // Fallback to search query if direct lookup didn't match
          try {
            const { data } = await api.get(`/items?search=${encodeURIComponent(rawSku)}`);
            if (Array.isArray(data) && data.length > 0) {
              match =
                data.find(i => i.itemNumber && i.itemNumber.toLowerCase().trim() === targetSku) ||
                data[0];
            }
          } catch (err) {
            console.error('Failed to look up item by itemNumber:', err);
          }
        }
      }

      if (match?._id) {
        navigate(`/item/${match._id}`);
        return;
      }
      showToast(`Item SKU "${rawSku}" not found`);
      return;
    }

    // Fallback: open zoom modal if no itemNumber is configured on the slide
    const imgUrl = brokenImages[`ad_${slideIndex}`]
      ? JEWELRY_FALLBACK_SVG
      : getImageUrl(slide.image);
    setZoomModalImg(imgUrl);
    setZoomModalTitle(slide?.title || 'New Variety Masterpiece');
  };

  // Filter and sort items
  const filteredItems = items.filter(item => {
    if (onlyAvailableStock && !item.inStock) {
      return false;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.itemNumber && item.itemNumber.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.metal && item.metal.toLowerCase().includes(q))
    );

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'sku') return a.itemNumber.localeCompare(b.itemNumber);
    if (sortBy === 'inStockFirst') return (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0);
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

  const uncategorizedItems = filteredItems.filter(
    item => !categories.some(cat => cat.name === item.category)
  );
  if (uncategorizedItems.length > 0) {
    categoryGroups.push({
      category: 'Exclusive Masterpieces',
      isProCategory: true,
      items: uncategorizedItems
    });
  }

  // Safe slide calculation
  const showBanner = settings?.proBannerVisible !== false && proSlides.length > 0;
  const safeSlideIdx = proSlides.length > 0 ? (currentSlideIdx % proSlides.length) : 0;
  const currentSlide = proSlides[safeSlideIdx] || null;
  const hasSlideText = Boolean(
    currentSlide && (
      (currentSlide.title && currentSlide.title.trim()) ||
      (currentSlide.subtitle && currentSlide.subtitle.trim()) ||
      (currentSlide.description && currentSlide.description.trim())
    )
  );

  // ─────────────────────────────────────────────────────────────
  // 1. RENDER LOGIN SCREEN (VIP Portal)
  // ─────────────────────────────────────────────────────────────
  if (!jeweller) {
    return (
      <div className="pro-template-container">
        <div className="pro-login-wrapper">
          <motion.div 
            className="pro-login-card-emerald"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {settings?.logo && !brokenImages['site_logo'] ? (
              <div className="pro-login-logo-wrap">
                <img
                  src={getImageUrl(settings.logo)}
                  alt={settings.siteTitle || 'The Thushi'}
                  className="pro-login-brand-logo"
                  onError={() => handleImageError('site_logo')}
                />
              </div>
            ) : (
              <div className="pro-login-icon-box">
                <Gem size={32} />
              </div>
            )}

            <div className="pro-login-badge-pill">
              <Gem size={13} />
              <span>THE THUSHI • PRO JEWELLERS</span>
              <Gem size={13} />
            </div>

            <h1 className="pro-login-title">Pro Jewellers Portal</h1>
            <p className="pro-login-subtitle">
              Exclusive high-jewellery digital catalog reserved strictly for authorized retail partners and jewellers.
            </p>

            {authError && (
              <motion.div 
                className="pro-auth-error-banner" 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span>{authError}</span>
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
                    placeholder="Enter your private password"
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="pro-btn-gold-pill"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw size={18} className="pro-spin-icon" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Pro Catalog</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="pro-login-footer-note">
              <div className="pro-security-badge">
                <ShieldCheck size={16} />
                <span>Authorized Jeweller Access Only</span>
              </div>
              <p>
                Credentials are provided by The Thushi administration. If you do not have an active Jeweller ID, please contact admin.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. RENDER WELCOME VIDEO INTRO (After Unlock Pro Catalog)
  // ─────────────────────────────────────────────────────────────
  if (showWelcomeVideo && settings?.proWelcomeVideo) {
    return (
      <div className="pro-welcome-video-overlay">
        <div className="pro-welcome-video-topbar">
          <div className="pro-welcome-video-brand">
            {settings?.logo && (
              <img
                src={getImageUrl(settings.logo)}
                alt={settings.siteTitle || 'The Thushi'}
                className="pro-welcome-video-logo"
              />
            )}
            <span>Welcome, <strong>{jeweller.name}</strong></span>
          </div>

          <div className="pro-welcome-video-actions">
            <button
              type="button"
              className="pro-welcome-sound-btn"
              onClick={() => {
                const nextMuted = !isVideoMuted;
                setIsVideoMuted(nextMuted);
                if (welcomeVideoRef.current) {
                  welcomeVideoRef.current.muted = nextMuted;
                }
              }}
              title={isVideoMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isVideoMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span>{isVideoMuted ? 'Unmute' : 'Sound On'}</span>
            </button>

            <button
              type="button"
              className="pro-welcome-skip-btn"
              onClick={() => {
                setShowWelcomeVideo(false);
                showToast(`Welcome back, ${jeweller.name}! VIP Access Granted.`);
              }}
            >
              <span>Skip Intro</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="pro-welcome-video-stage">
          <video
            ref={welcomeVideoRef}
            src={getImageUrl(settings.proWelcomeVideo)}
            autoPlay
            playsInline
            muted={isVideoMuted}
            className="pro-welcome-video-player"
            onEnded={() => {
              setShowWelcomeVideo(false);
              showToast(`Welcome back, ${jeweller.name}! VIP Access Granted.`);
            }}
            onError={() => {
              setShowWelcomeVideo(false);
            }}
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. RENDER AUTHENTICATED PRO COLLECTION (MATCHING TEMPLATE IMAGE)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="pro-template-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            className="pro-floating-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <CheckCircle2 size={18} color="#22c55e" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TOP VIP JEWELLER HEADER BAR ─── */}
      <div className="pro-top-nav-bar">
        <div className="pro-top-greeting-wrap">
          <span className="pro-vip-badge-tag">
            <Sparkles size={13} /> VIP JEWELLER
          </span>
          <h1 className="pro-top-greeting-text">
            Hello <span className="pro-greeting-gold">{jeweller.name}</span>, here is pro collection of the thushi for you
          </h1>
          <div className="pro-top-meta-pills">
            <span className="pro-jeweller-id-pill">
              <Store size={14} /> ID: {jeweller.loginId}
            </span>
            {jeweller.mobile && (
              <span className="pro-jeweller-id-pill">
                {jeweller.mobile}
              </span>
            )}
          </div>
        </div>

        <button 
          type="button" 
          className="pro-btn-logout-clean" 
          onClick={handleLogout}
          title="Sign out of Pro Collection"
        >
          <LogOut size={16} />
          <span>Exit</span>
        </button>
      </div>

      {/* ─── SECTION 1: LUXURY HERO / AD BANNER SHOWCASE ─── */}
      {showBanner && currentSlide && (
        <div
          className={`pro-hero-banner-showcase ${
            !hasSlideText
              ? 'pro-hero-image-only'
              : settings?.proBannerLayout === 'full'
              ? 'pro-hero-full-overlay'
              : ''
          }`}
          onMouseEnter={() => setIsSlidePaused(true)}
          onMouseLeave={() => setIsSlidePaused(false)}
        >
          {!hasSlideText ? (
            /* IMAGE-ONLY CLEAR BANNER (No text, no tag, no button) */
            <div
              className="pro-hero-image-only-click-area"
              onClick={() => handleSlideInspect(currentSlide, safeSlideIdx)}
              style={{ cursor: 'pointer', width: '100%', height: '100%' }}
              title={currentSlide.itemNumber ? `Click to view item ${currentSlide.itemNumber}` : 'Click to inspect design'}
            >
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.img
                  key={safeSlideIdx}
                  className="pro-hero-full-bg-img"
                  src={brokenImages[`ad_${safeSlideIdx}`] ? JEWELRY_FALLBACK_SVG : getImageUrl(currentSlide.image)}
                  alt="Featured Variety"
                  onError={() => handleImageError(`ad_${safeSlideIdx}`)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </AnimatePresence>
            </div>
          ) : settings?.proBannerLayout === 'full' ? (
            /* OPTION 2: FULL BANNER IMAGE WITH TEXT OVERLAY */
            <div
              onClick={() => handleSlideInspect(currentSlide, safeSlideIdx)}
              style={{ cursor: 'pointer', width: '100%', height: '100%', position: 'relative' }}
              title={currentSlide.itemNumber ? `Click to view item ${currentSlide.itemNumber}` : 'Click to inspect design'}
            >
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.img
                  key={safeSlideIdx}
                  className="pro-hero-full-bg-img"
                  src={brokenImages[`ad_${safeSlideIdx}`] ? JEWELRY_FALLBACK_SVG : getImageUrl(currentSlide.image)}
                  alt={currentSlide.title || 'Masterpiece Creation'}
                  onError={() => handleImageError(`ad_${safeSlideIdx}`)}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </AnimatePresence>

              <div className="pro-hero-full-scrim" />

              <div className="pro-hero-full-overlay-content">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={safeSlideIdx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="pro-hero-copy-content"
                  >
                    <span className="pro-hero-pill-badge">
                      {currentSlide.badge || 'PRO EXCLUSIVE'}
                    </span>

                    {currentSlide.title && (
                      <h2 className="pro-hero-masterpiece-title">
                        {currentSlide.title}
                      </h2>
                    )}

                    {currentSlide.subtitle && (
                      <div className="pro-hero-masterpiece-sub">
                        ({currentSlide.subtitle})
                      </div>
                    )}

                    {currentSlide.description && (
                      <p className="pro-hero-masterpiece-desc">
                        {currentSlide.description}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* OPTION 1: SPLIT LAYOUT (DEFAULT) */
            <div className="pro-hero-layout-grid">
              {/* Visual Side */}
              <div 
                className="pro-hero-visual-side"
                onClick={() => handleSlideInspect(currentSlide, safeSlideIdx)}
                title={currentSlide.itemNumber ? `Click to view item ${currentSlide.itemNumber}` : 'Click to inspect masterpiece'}
              >
                <div className="pro-hero-stand-glow"></div>
                
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div
                    key={safeSlideIdx}
                    className="pro-hero-img-box"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    <img 
                      className="pro-hero-pedestal-img"
                      src={brokenImages[`ad_${safeSlideIdx}`] ? JEWELRY_FALLBACK_SVG : getImageUrl(currentSlide.image)}
                      alt={currentSlide.title || 'Masterpiece Creation'}
                      onError={() => handleImageError(`ad_${safeSlideIdx}`)}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Editorial Content Side */}
              <div 
                className="pro-hero-copy-side"
                onClick={() => handleSlideInspect(currentSlide, safeSlideIdx)}
                style={{ cursor: 'pointer' }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={safeSlideIdx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="pro-hero-copy-content"
                  >
                    <span className="pro-hero-pill-badge">
                      {currentSlide.badge || 'PRO EXCLUSIVE'}
                    </span>

                    {currentSlide.title && (
                      <h2 className="pro-hero-masterpiece-title">
                        {currentSlide.title}
                      </h2>
                    )}

                    {currentSlide.subtitle && (
                      <div className="pro-hero-masterpiece-sub">
                        ({currentSlide.subtitle})
                      </div>
                    )}

                    {currentSlide.description && (
                      <p className="pro-hero-masterpiece-desc">
                        {currentSlide.description}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Fixed Slider Controls (Same position regardless of text/empty/layout) */}
          {proSlides.length > 1 && (
            <div className="pro-hero-fixed-controls" onClick={(e) => e.stopPropagation()}>
              <div className="pro-hero-fixed-arrows">
                <button
                  type="button"
                  className="pro-hero-arrow-btn"
                  onClick={handlePrevSlide}
                  aria-label="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="pro-hero-arrow-btn"
                  onClick={handleNextSlide}
                  aria-label="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="pro-hero-fixed-dots">
                {proSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`pro-hero-dot ${idx === safeSlideIdx ? 'active' : ''}`}
                    onClick={() => handleSelectSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SECTION 2: RICH EMERALD GREEN SHOWCASE (Template Middle Section) ─── */}
      <div className="pro-emerald-showcase-section">
        {/* Section Header */}
        <div className="pro-emerald-top-bar">
          <div className="pro-emerald-title-group">
            <h2 className="pro-emerald-heading">Pro Jewellers Catalog</h2>
            <p className="pro-emerald-subheading">Handpicked exclusive creations available for retail partners.</p>
          </div>
        </div>

        {/* ─── CAPSULE CATEGORIES (Product Collections moved to top) ─── */}
        <div className="pro-emerald-capsules-section">
          <div className="pro-capsules-header">
            <h3>Product Collections</h3>
            <p>Explore handcrafted categories curated for authorized partners</p>
          </div>

          <div className="pro-capsules-row">
            {/* "All" Capsule */}
            <div 
              className={`pro-capsule-item ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <div className="pro-capsule-circle-icon">
                <Sparkles size={24} />
              </div>
              <span className="pro-capsule-label">All Items</span>
            </div>

            {categories.map((cat, idx) => {
              const catItem = items.find(i => i.category === cat.name && i.images && i.images[0]);
              const catImg = catItem ? getImageUrl(catItem.images[0]) : null;

              return (
                <div 
                  key={cat._id || idx}
                  className={`pro-capsule-item ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <div className="pro-capsule-circle-icon">
                    {catImg ? (
                      <img src={catImg} alt={cat.name} />
                    ) : (
                      <Gem size={24} />
                    )}
                  </div>
                  <span className="pro-capsule-label">{cat.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="pro-emerald-controls-bar">
          <div className="pro-emerald-search-wrap">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search jewellery name, SKU, metal or purity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="clear-btn" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Available Stock Toggle Switch */}
          <div className="pro-stock-toggle-pill-wrap">
            <button
              type="button"
              className={`pro-stock-toggle-pill ${onlyAvailableStock ? 'active' : ''}`}
              onClick={() => setOnlyAvailableStock(!onlyAvailableStock)}
            >
              <div className="toggle-track">
                <span className="toggle-thumb" />
              </div>
              <span className="toggle-text">
                <PackageCheck size={16} />
                <span>Available Ready Stock</span>
              </span>
            </button>
          </div>

          {/* Sort & View Mode */}
          <div className="pro-emerald-sort-wrap">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Sort: Newest Arrivals</option>
              <option value="inStockFirst">Sort: In-Stock First</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="sku">Sort: SKU Code</option>
            </select>
          </div>
        </div>

        {/* Active Stock Notice */}
        {onlyAvailableStock && (
          <div className="pro-emerald-active-filter-notice">
            <PackageCheck size={18} color="#22c55e" />
            <span>Showing ready-made stock available for immediate dispatch ({filteredItems.length} found).</span>
            <button type="button" onClick={() => setOnlyAvailableStock(false)}>
              Show All Designs
            </button>
          </div>
        )}

        {/* ─── ARCHED CARDS GRID (Exact Shape and Style from the Template Image!) ─── */}
        {isLoading ? (
          <div className="pro-emerald-loading">
            <RefreshCw size={36} className="pro-spin-icon" />
            <p>Loading Pro Jewellers Catalog...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="pro-emerald-empty">
            <Gem size={44} />
            <h3>No jewellery designs found</h3>
            <p>Try clearing your search keyword or switching category tabs.</p>
            {onlyAvailableStock && (
              <button type="button" className="pro-btn-gold-pill" onClick={() => setOnlyAvailableStock(false)}>
                Show All Custom Designs
              </button>
            )}
          </div>
        ) : viewMode === 'category' && selectedCategory === 'all' ? (
          /* Category Groups */
          <div className="pro-emerald-category-groups">
            {categoryGroups.map((group, gIdx) => (
              <div key={gIdx} className="pro-emerald-group-block">
                <div className="pro-emerald-group-header">
                  <h3>{group.category}</h3>
                  <span className="count-tag">{group.items.length} {group.items.length === 1 ? 'Design' : 'Designs'}</span>
                </div>

                <div className="pro-arch-cards-grid">
                  {group.items.map((item, itemIdx) => (
                    <ArchJewelCard 
                      key={item._id}
                      item={item}
                      index={itemIdx}
                      copiedId={copiedId}
                      addedId={addedId}
                      brokenImages={brokenImages}
                      onCopySku={handleCopyItemNo}
                      onAddToOrder={handleAddToOrder}
                      onZoom={() => {
                        const img = (item.images && item.images[0] && !brokenImages[item._id]) 
                          ? getImageUrl(item.images[0]) 
                          : JEWELRY_FALLBACK_SVG;
                        setZoomModalImg(img);
                        setZoomModalTitle(item.name);
                      }}
                      onImageError={() => handleImageError(item._id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Unified Grid */
          <div className="pro-arch-cards-grid">
            {filteredItems.map((item, itemIdx) => (
              <ArchJewelCard 
                key={item._id}
                item={item}
                index={itemIdx}
                copiedId={copiedId}
                addedId={addedId}
                brokenImages={brokenImages}
                onCopySku={handleCopyItemNo}
                onAddToOrder={handleAddToOrder}
                onZoom={() => {
                  const img = (item.images && item.images[0] && !brokenImages[item._id]) 
                    ? getImageUrl(item.images[0]) 
                    : JEWELRY_FALLBACK_SVG;
                  setZoomModalImg(img);
                  setZoomModalTitle(item.name);
                }}
                onImageError={() => handleImageError(item._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── SECTION 4: EDITORIAL PROMO TILES (Template Bottom Section) ─── */}
      <div className="pro-promo-tiles-row">
        <div className="pro-promo-tile purple-tile">
          <div className="pro-promo-copy">
            <span className="pro-promo-badge">Master Craftsmanship</span>
            <h3>100% Certified By The Thushi</h3>
            <p>Every Thushi creation meets the highest gold purity standards with certified guarantees.</p>
          </div>
          <div className="pro-promo-decor">
            <Award size={48} />
          </div>
        </div>

        <div className="pro-promo-tile olive-tile">
          <div className="pro-promo-copy">
            <span className="pro-promo-badge">Priority Jeweller Dispatch</span>
            <h3>Custom & Ready-Made Stock</h3>
            <p>Choose immediate delivery from our available stock or request bespoke made-to-order sizing.</p>
          </div>
          <div className="pro-promo-decor">
            <PackageCheck size={48} />
          </div>
        </div>
      </div>

      {/* ─── FULL-SCREEN HIGH-RES LIGHTBOX MODAL ─── */}
      <AnimatePresence>
        {zoomModalImg && (
          <motion.div 
            className="pro-lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomModalImg(null)}
          >
            <motion.div 
              className="pro-lightbox-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pro-lightbox-header">
                <span className="pro-lightbox-title">
                  <Gem size={18} style={{ color: '#d4af37' }} />
                  {zoomModalTitle || 'Jewellery View'}
                </span>
                <button 
                  type="button"
                  className="pro-lightbox-close"
                  onClick={() => setZoomModalImg(null)}
                  title="Close (Esc)"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="pro-lightbox-body">
                <img 
                  src={zoomModalImg} 
                  alt={zoomModalTitle || 'Zoomed preview'} 
                  className="pro-lightbox-image"
                />
              </div>

              <div className="pro-lightbox-footer">
                <span>The Thushi Exclusive Pro Collection</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENT: ARCH-SHAPED JEWEL CARD (FROM TEMPLATE IMAGE)
// ─────────────────────────────────────────────────────────────
const ArchJewelCard = ({ 
  item, 
  index, 
  copiedId, 
  addedId, 
  brokenImages, 
  onCopySku, 
  onAddToOrder, 
  onZoom, 
  onImageError 
}) => {
  const isCopied = copiedId === item._id;
  const isAdded = addedId === item._id;
  const isBroken = brokenImages[item._id];
  const primaryImage = (item.images && item.images[0] && !isBroken)
    ? getImageUrl(item.images[0])
    : JEWELRY_FALLBACK_SVG;

  return (
    <motion.div 
      className="pro-arch-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
    >
      {/* Arch Top Vitrine Frame */}
      <div className="pro-arch-frame" onClick={onZoom} title="Click to view full size">
        <div className="pro-arch-img-ambient"></div>
        <img 
          src={primaryImage} 
          alt={item.name} 
          className="pro-arch-jewel-img"
          loading="lazy"
          onError={onImageError}
        />
        <div className="pro-arch-zoom-btn">
          <Maximize2 size={15} />
        </div>
      </div>

      {/* Card Info Body */}
      <div className="pro-arch-body">
        {/* Badge Tag (Red/Gold pill matching template) */}
        <div className="pro-arch-badge-row">
          {item.inStock ? (
            <span className="pro-arch-pill green-pill">
              Ready Stock
            </span>
          ) : (
            <span className="pro-arch-pill red-pill">
              Pro Exclusive
            </span>
          )}
        </div>

        {/* Item Title */}
        <h4 className="pro-arch-title" title={item.name}>
          {item.name}
        </h4>

        {/* SKU Pill (Click to copy) */}
        <div 
          className={`pro-arch-sku ${isCopied ? 'copied' : ''}`}
          onClick={(e) => onCopySku(e, item.itemNumber, item._id)}
          title="Click to copy SKU"
        >
          {isCopied ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
          <span>SKU: {item.itemNumber}</span>
          {isCopied && <span className="copied-text">Copied!</span>}
        </div>

        {/* Specs Row */}
        <div className="pro-arch-specs-line">
          <span>{item.weightRange || 'On Request'}</span>
          <span className="sep">•</span>
          <span>{item.metal || '22K Gold'}</span>
        </div>

        {/* Bottom Actions: Gold Pill CTA Button */}
        <div className="pro-arch-actions">
          <button
            type="button"
            className={`pro-arch-order-btn ${isAdded ? 'is-added' : ''}`}
            onClick={(e) => onAddToOrder(e, item)}
          >
            {isAdded ? (
              <>
                <Check size={15} />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag size={15} />
                <span>Add for Order</span>
              </>
            )}
          </button>
          
          <Link to={`/item/${item._id}`} className="pro-arch-view-link">
            Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProCollection;