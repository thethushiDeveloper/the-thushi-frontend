import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Diamond, Sun, Moon } from 'lucide-react';
import api from '../utils/api';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoDisplayMode, setLogoDisplayMode] = useState('text');
  const [siteTitle, setSiteTitle] = useState('The Thushi');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data) {
          if (data.logo) setLogoUrl(data.logo);
          if (data.logoDisplayMode) setLogoDisplayMode(data.logoDisplayMode);
          if (data.siteTitle) setSiteTitle(data.siteTitle);
          if (data.globalFont) document.documentElement.style.setProperty('--global-font', data.globalFont.replace(/['"]/g, ''));
        }
      } catch (error) { }
    };
    fetchSettings();

    const handleSettingsUpdate = () => fetchSettings();
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          {(logoDisplayMode === 'image' || logoDisplayMode === 'both') && logoUrl ? (
            <img src={`http://localhost:5000${logoUrl}`} alt={`${siteTitle || 'The Thushi'} Logo`} style={{ height: '40px', marginRight: logoDisplayMode === 'both' ? '10px' : '0' }} />
          ) : (
            <Diamond className="logo-icon" />
          )}
          {(logoDisplayMode === 'text' || logoDisplayMode === 'both') && (
            <span style={{ marginLeft: logoDisplayMode === 'both' && !logoUrl ? '10px' : '0' }}>{siteTitle}</span>
          )}
        </Link>
        <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </div>
        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link to="/" className="nav-links" onClick={() => setIsOpen(false)}>Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/catalog" className="nav-links" onClick={() => setIsOpen(false)}>Collection</Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-links" onClick={() => setIsOpen(false)}>About Us</Link>
          </li>
          {token ? (
            <>
              <li className="nav-item">
                <Link to="/admin/dashboard" className="nav-links" onClick={() => setIsOpen(false)}>Dashboard</Link>
              </li>
              <li className="nav-item">
                <button className="nav-links btn-logout" onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <Link to="/admin/login" className="nav-links" onClick={() => setIsOpen(false)}>Admin</Link>
            </li>
          )}
          <li className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className="nav-links"
              onClick={() => {
                setTheme(prev => prev === 'dark' ? 'light' : 'dark');
                setIsOpen(false);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
