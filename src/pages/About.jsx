import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import api, { getImageUrl } from '../utils/api';

const About = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings', error);
      }
    };
    fetchSettings();
  }, []);

  if (!settings) return <div className="loading" style={{textAlign: 'center', padding: '5rem'}}>Loading...</div>;

  return (
    <div className="about-container animate-fade-in" style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
      <div className="section-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '2px' }}>About Us</h1>
        <div className="underline" style={{ width: '60px', height: '2px', background: 'var(--primary-color)', margin: '0.5rem auto' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', maxWidth: '900px', margin: '0 auto' }}
      >
        {settings.aboutMode === 'image' && settings.aboutImage ? (
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <img src={getImageUrl(settings.aboutImage)} alt={`About ${settings.siteTitle || 'The Thushi'}`} style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} />
          </div>
        ) : (
          <div style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text-color, #e0e0e0)', marginBottom: '3rem', whiteSpace: 'pre-line', textAlign: 'center' }}>
            {settings.aboutText || `Welcome to ${settings.siteTitle || 'The Thushi'}. We provide the finest jewelry crafted with exquisite perfection and timeless elegance in mind.`}
          </div>
        )}

        {settings.address && (
          <div style={{ borderTop: '1px solid #333', paddingTop: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <MapPin size={24} /> Our Location
            </h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-color, #ccc)', whiteSpace: 'pre-line' }}>{settings.address}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default About;
