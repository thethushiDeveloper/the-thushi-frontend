import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import api, { getImageUrl } from '../utils/api';
import './Home.css';

// ─── Lerp helpers ────────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

// ─── Jewelry Voyage Slider ────────────────────────────────────────────────────
const JewelrySlider = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(slides.length - 1);
  const [next, setNext] = useState(Math.min(1, slides.length - 1));
  const [animating, setAnimating] = useState(false);
  const rafRef = useRef(null);
  const slideRefs = useRef([]);
  const slideInnerRefs = useRef([]);
  const tiltDataRef = useRef(
    slides.map(() => ({
      rotCurrent: { x: 0, y: 0 },
      rotTarget: { x: 0, y: 0 },
      bgCurrent: { x: 0, y: 0 },
      bgTarget: { x: 0, y: 0 },
      lerpAmount: 0.06,
    }))
  );

  // BASE_URL is imported from api.js

  // Raf loop for smooth tilt
  useEffect(() => {
    let id;
    const tick = () => {
      tiltDataRef.current.forEach((td, i) => {
        td.rotCurrent.x = lerp(td.rotCurrent.x, td.rotTarget.x, td.lerpAmount);
        td.rotCurrent.y = lerp(td.rotCurrent.y, td.rotTarget.y, td.lerpAmount);
        td.bgCurrent.x = lerp(td.bgCurrent.x, td.bgTarget.x, td.lerpAmount);
        td.bgCurrent.y = lerp(td.bgCurrent.y, td.bgTarget.y, td.lerpAmount);
        const inner = slideInnerRefs.current[i];
        if (inner) {
          inner.style.setProperty('--rotX', td.rotCurrent.y.toFixed(2) + 'deg');
          inner.style.setProperty('--rotY', td.rotCurrent.x.toFixed(2) + 'deg');
          inner.style.setProperty('--bgPosX', td.bgCurrent.x.toFixed(2) + '%');
          inner.style.setProperty('--bgPosY', td.bgCurrent.y.toFixed(2) + '%');
        }
      });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    rafRef.current = id;
    return () => cancelAnimationFrame(id);
  }, [slides.length]);

  const handleMouseMove = useCallback((e, idx) => {
    const el = slideInnerRefs.current[idx];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const td = tiltDataRef.current[idx];
    td.lerpAmount = 0.1;
    const ox = (offsetX - el.clientWidth * 0.5) / (Math.PI * 3);
    const oy = -(offsetY - el.clientHeight * 0.5) / (Math.PI * 4);
    td.rotTarget.x = ox;
    td.rotTarget.y = oy;
    td.bgTarget.x = -ox * 0.3;
    td.bgTarget.y = oy * 0.3;
  }, []);

  const handleMouseLeave = useCallback((idx) => {
    const td = tiltDataRef.current[idx];
    td.lerpAmount = 0.06;
    td.rotTarget.x = 0;
    td.rotTarget.y = 0;
    td.bgTarget.x = 0;
    td.bgTarget.y = 0;
  }, []);

  const change = useCallback((dir) => {
    if (animating || slides.length < 2) return;
    setAnimating(true);
    const total = slides.length;
    setCurrent(c => {
      const nc = (c + dir + total) % total;
      setPrev((nc - 1 + total) % total);
      setNext((nc + 1) % total);
      return nc;
    });
    setTimeout(() => setAnimating(false), 900);
  }, [animating, slides.length]);

  // --- Auto scroll effect ---
  useEffect(() => {
    if (slides.length < 2) return;
    const interval = setInterval(() => {
      // Check if user is hovering over the slider container
      const isHovering = document.querySelector('.vjslider-root:hover');
      if (!isHovering && !animating) {
        change(1);
      }
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [change, animating, slides.length]);

  const getAttr = (idx) => {
    if (idx === current) return 'data-current';
    if (idx === next) return 'data-next';
    if (idx === prev) return 'data-previous';
    return null;
  };

  return (
    <div className="vjslider-root">
      <div className="vjslider-grain"></div>

      {/* Background blobs */}
      {slides.map((slide, idx) => {
        const attr = getAttr(idx);
        return (
          <div
            key={`bg-${idx}`}
            className={`vjslide__bg ${attr ? attr : 'vjslide__bg--hidden'}`}
            style={{ '--bg': `url("${getImageUrl(slide.image)}")` }}
            {...(attr === 'data-current' ? { 'data-current': '' } : {})}
            {...(attr === 'data-next' ? { 'data-next': '' } : {})}
            {...(attr === 'data-previous' ? { 'data-previous': '' } : {})}
          />
        );
      })}

      <button className="vjslider-btn vjslider-btn--prev" onClick={() => change(-1)} aria-label="Previous slide">
        <ChevronLeft size={32} strokeWidth={1} />
      </button>

      <div className="vjslides__wrapper">
        {/* Slide images */}
        <div className="vjslides">
          {slides.map((slide, idx) => {
            const attr = getAttr(idx);
            return (
              <div
                key={`slide-${idx}`}
                className="vjslide"
                ref={el => slideRefs.current[idx] = el}
                onMouseMove={e => handleMouseMove(e, idx)}
                onMouseLeave={() => handleMouseLeave(idx)}
                {...(attr === 'data-current' ? { 'data-current': '' } : {})}
                {...(attr === 'data-next' ? { 'data-next': '' } : {})}
                {...(attr === 'data-previous' ? { 'data-previous': '' } : {})}
              >
                <div className="vjslide__inner" ref={el => slideInnerRefs.current[idx] = el}>
                  <div className="vjslide--image__wrapper">
                    <img
                      className="vjslide--image"
                      src={getImageUrl(slide.image)}
                      alt={slide.title || `Jewellery slide ${idx + 1}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slide text infos */}
        <div className="vjslides--infos">
          {slides.map((slide, idx) => {
            const attr = getAttr(idx);
            return (
              <div
                key={`info-${idx}`}
                className="vjslide-info"
                {...(attr === 'data-current' ? { 'data-current': '' } : {})}
                {...(attr === 'data-next' ? { 'data-next': '' } : {})}
                {...(attr === 'data-previous' ? { 'data-previous': '' } : {})}
              >
                <div className="vjslide-info__inner">
                  <div className="vjslide-info--text__wrapper">
                    <div data-title="" className="vjslide-info--text">
                      <span>{slide.title || 'Jewellery'}</span>
                    </div>
                    {slide.subtitle && (
                      <div data-subtitle="" className="vjslide-info--text">
                        <span>{slide.subtitle}</span>
                      </div>
                    )}
                    {slide.description && (
                      <div data-description="" className="vjslide-info--text">
                        <span>{slide.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="vjslider-btn vjslider-btn--next" onClick={() => change(1)} aria-label="Next slide">
        <ChevronRight size={32} strokeWidth={1} />
      </button>

      {/* Pagination dots */}
      <div className="vjslider-pagination">
        {slides.map((_, i) => (
          <button 
            key={i} 
            className={`vjslider-dot ${i === current ? 'active' : ''}`}
            onClick={() => {
              if (animating) return;
              const dir = i > current ? 1 : -1;
              if (i !== current) {
                setAnimating(true);
                setCurrent(i);
                setPrev((i - 1 + slides.length) % slides.length);
                setNext((i + 1) % slides.length);
                setTimeout(() => setAnimating(false), 850);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Main Home Component ──────────────────────────────────────────────────────
const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showCallMenu, setShowCallMenu] = useState(false);
  
  const phoneNumbers = settings?.phoneNumber ? settings.phoneNumber.split(',').map(n => n.trim()).filter(n => n) : [];
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyItemNo = (e, itemNumber, id) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(itemNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const categorySliderRef = useRef(null);
  const catAutoScrollRef = useRef(null);
  const catDirectionRef = useRef(1); // 1 = right, -1 = left

  // Auto-scroll the category strip back and forth
  const startCatScroll = () => {
    const slider = categorySliderRef.current;
    if (!slider) return;
    const SPEED = 1.2;
    const step = () => {
      if (!categorySliderRef.current) return;
      categorySliderRef.current.scrollLeft += SPEED * catDirectionRef.current;
      const maxScroll = categorySliderRef.current.scrollWidth - categorySliderRef.current.clientWidth;
      if (categorySliderRef.current.scrollLeft >= maxScroll - 2) catDirectionRef.current = -1;
      if (categorySliderRef.current.scrollLeft <= 2) catDirectionRef.current = 1;
      catAutoScrollRef.current = requestAnimationFrame(step);
    };
    catAutoScrollRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (allCategories.length === 0) return;
    // short delay to ensure DOM is painted
    const timer = setTimeout(() => startCatScroll(), 300);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(catAutoScrollRef.current);
    };
  }, [allCategories]);

  const pauseCatScroll = () => {
    cancelAnimationFrame(catAutoScrollRef.current);
    catAutoScrollRef.current = null;
  };

  const resumeCatScroll = () => {
    if (!catAutoScrollRef.current) startCatScroll();
  };

  const scrollCatManual = (dir) => {
    pauseCatScroll();
    const slider = categorySliderRef.current;
    if (!slider) return;
    slider.scrollBy({ left: dir * 260, behavior: 'smooth' });
    // resume auto-scroll after manual interaction
    setTimeout(() => startCatScroll(), 1200);
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data: items } = await api.get('/items');
        setFeatured(items.slice(0, 4));
        
        try {
          const { data: cats } = await api.get('/categories');
          const categoryData = cats.map(cat => {
             const foundItem = items.find(i => i.category === cat.name && i.images && i.images.length > 0);
             return {
               ...cat,
               image: foundItem ? getImageUrl(foundItem.images[0]) : null
             };
          });
          setAllCategories(categoryData);
        } catch (e) {
          console.error("Error fetching categories", e);
        }
      } catch (error) {
        console.error('Error fetching featured items', error);
      }
    };

    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings', error);
      }
    };

    fetchFeatured();
    fetchSettings();
  }, []);

  // Hero background auto-slide
  useEffect(() => {
    if (settings?.sliders?.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % settings.sliders.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [settings]);

  const defaultSlider = 'https://images.unsplash.com/photo-1599643478514-4a4204b4ba79';
  const getBackgroundImage = () => {
    if (settings && settings.sliders && settings.sliders.length > 0) {
      const slideIndex = currentSlide % settings.sliders.length;
      return `url("${getImageUrl(settings.sliders[slideIndex])}")`;

    }
    return `url("${defaultSlider}")`;
  };

  const showJewelrySlider =
    settings?.jewelrySliderVisible !== false &&
    Array.isArray(settings?.jewelrySlides) &&
    settings.jewelrySlides.length > 0;

  return (
    <div className="home-container">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="hero-section"
        style={{ backgroundImage: getBackgroundImage(), transition: 'background-image 1s ease-in-out' }}
      >
        <div className="hero-overlay"></div>
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1>{settings?.siteTitle || 'The Thushi'}</h1>
          <p>{settings?.heroSubtitle || 'Exquisite Craftsmanship. Timeless Elegance.'}</p>
          <Link to="/catalog">
            <button className="btn btn-primary hero-btn">Explore Collection</button>
          </Link>
        </motion.div>
      </section>

      {/* ── Jewelry Voyage Slider ─────────────────────────────────── */}
      {showJewelrySlider && (
        <section className="vjslider-section">
          <div className="vjslider-section__title">
            <h2>OUR COLLECTION</h2>
            <div className="underline"></div>
          </div>
          <JewelrySlider slides={settings.jewelrySlides} />
        </section>
      )}

      {/* ── Shop by Category ────────────────────────────────────── */}
      {allCategories.length > 0 && (
        <section className="categories-section">
          <div className="section-title" style={{ marginBottom: '2rem' }}>
            <h2>Shop by Category</h2>
            <div className="underline"></div>
          </div>
          <div className="categories-slider-wrapper">
            <button
              className="cat-nav-btn cat-nav-btn--prev"
              onClick={() => scrollCatManual(-1)}
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>
            <div
              className="categories-slider"
              ref={categorySliderRef}
              onMouseEnter={pauseCatScroll}
              onMouseLeave={resumeCatScroll}
            >
              {allCategories.map(cat => (
                <Link to={`/catalog?category=${encodeURIComponent(cat.name)}`} key={cat._id} className="category-card">
                  <div className="category-image-wrapper">
                    <img src={cat.image} alt={cat.name} className="category-image" />
                  </div>
                  <h3 className="category-name">{cat.name}</h3>
                </Link>
              ))}
            </div>
            <button
              className="cat-nav-btn cat-nav-btn--next"
              onClick={() => scrollCatManual(1)}
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>
      )}

      {/* ── Featured Jewellery ────────────────────────────────────── */}
      <section className="featured-section">
        <div className="section-title">
          <h2>Featured Jewellery</h2>
          <div className="underline"></div>
        </div>

        <div className="featured-grid">
          {featured.map((item, index) => (
            <motion.div
              className="featured-card"
              key={item._id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="card-image-wrapper">
                <img
                  src={item.images[0] ? getImageUrl(item.images[0]) : 'https://via.placeholder.com/300x400?text=No+Image'}
                  alt={item.name}
                  className="card-image"
                />
              </div>
              <div className="card-info">
                <h3>{item.name}</h3>
                <p
                  className="item-number badge-copyable"
                  onClick={(e) => handleCopyItemNo(e, item.itemNumber, item._id)}
                  title="Click to copy item number"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedId === item._id ? <Check size={12} /> : <Copy size={12} />}
                  Item No: {item.itemNumber}
                  {copiedId === item._id && <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}> Copied!</span>}
                </p>
                <div className="card-actions">
                  <Link to={`/item/${item._id}`} className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/catalog">
            <button className="btn btn-primary">View Full Catalog</button>
          </Link>
        </div>
      </section>

      {/* ── Floating Buttons ─────────────────────────────────────── */}
      {settings && (
        <div className="floating-buttons" style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 1000 }}>
          {settings.whatsappNumber && (
            <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer"
              style={{ backgroundColor: '#25D366', color: 'white', padding: '1rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', transition: 'transform 0.3s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <MessageCircle size={24} />
            </a>
          )}
          {phoneNumbers.length > 0 && (
            <div style={{ position: 'relative' }}>
              {showCallMenu && phoneNumbers.length > 1 && (
                <div style={{ position: 'absolute', bottom: '100%', right: '0', marginBottom: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px', zIndex: 1000 }}>
                  {phoneNumbers.map((num, idx) => (
                    <a key={`call-${idx}`} href={`tel:${num}`} style={{ textDecoration: 'none', color: 'var(--text-color)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderRadius: '4px' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-color)'; e.currentTarget.style.color = '#000'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-color)'; }}>
                      <Phone size={14} style={{ marginRight: '8px' }}/> {num}
                    </a>
                  ))}
                </div>
              )}
              <button 
                onClick={() => {
                  if (phoneNumbers.length === 1) window.location.href = `tel:${phoneNumbers[0]}`;
                  else setShowCallMenu(!showCallMenu);
                }}
                title="Call Us"
                style={{ backgroundColor: '#34b7f1', color: 'white', padding: '1rem', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', transition: 'transform 0.3s', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Phone size={24} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
