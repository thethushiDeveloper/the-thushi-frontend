import React, { useEffect, useState } from 'react';
import { Diamond, Phone, MessageCircle } from 'lucide-react';
import './Footer.css';
import api, { getImageUrl } from '../utils/api';

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Footer = () => {
  const [settings, setSettings] = useState({ phoneNumber: '', whatsappNumber: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings');
      }
    };
    fetchSettings();

    const handleSettingsUpdate = () => fetchSettings();
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  return (
    <footer className="footer-container">
      <div className="footer-links">
        <div className="footer-link-wrapper">
          <div className="footer-link-items">
            <h2>{settings.siteTitle || 'The Thushi'}</h2>
            <p>Trusted Suppliers of Kolhapuri Gold Jewellery</p>
          </div>
          <div className="footer-link-items">
            <h2>Contact Us</h2>
            <div className="contact-info" style={{ alignItems: 'flex-start' }}>
              <Phone size={18} style={{ marginTop: '0.2rem' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {settings.phoneNumber ? (
                  settings.phoneNumber.split(',').map((num, idx) => (
                    <span key={idx} style={{ marginBottom: '0.2rem' }}>{num.trim()}</span>
                  ))
                ) : (
                  <span>+91 1234567890</span>
                )}
              </div>
            </div>
            <div className="contact-info">
              <MessageCircle size={18} />
              {settings.whatsappNumber ? (
                <a href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {settings.whatsappNumber.startsWith('+') ? settings.whatsappNumber : `+${settings.whatsappNumber}`}
                </a>
              ) : (
                <span>+91 9359758554</span>
              )}
            </div>
          </div>
          <div className="footer-link-items">
            <h2>Social</h2>
            {settings.instagramLink && (
              <a href={settings.instagramLink} target="_blank" rel="noreferrer" className="contact-info" style={{ color: 'var(--text-color)', textDecoration: 'none' }}>
                <InstagramIcon /> <span>Instagram</span>
              </a>
            )}
            {settings.facebookLink && (
              <a href={settings.facebookLink} target="_blank" rel="noreferrer" className="contact-info" style={{ color: 'var(--text-color)', textDecoration: 'none' }}>
                <FacebookIcon /> <span>Facebook</span>
              </a>
            )}
            {!settings.instagramLink && !settings.facebookLink && (
              <p style={{ color: 'var(--text-color)', opacity: 0.7 }}>Follow us on social media.</p>
            )}
          </div>
        </div>
      </div>
      <section className="social-media">
        <div className="social-media-wrap">
          <div className="footer-logo">
            {settings.logo ? <img src={getImageUrl(settings.logo)} alt="Logo" style={{ height: '30px', marginRight: '10px' }} /> : <Diamond className="logo-icon-sm" />} {settings.siteTitle || 'The Thushi'}
          </div>
          <small className="website-rights">{settings.siteTitle || 'The Thushi'} © 2021</small>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
