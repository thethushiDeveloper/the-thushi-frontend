import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid, Settings as SettingsIcon, Users, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalItems: 0, totalJewellers: 0, proItems: 0 });

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
    } else {
      fetchStats();
    }
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const [itemsRes, jewellersRes] = await Promise.all([
        api.get('/items?admin=true'),
        api.get('/jewellers').catch(() => ({ data: [] }))
      ]);
      const items = itemsRes.data || [];
      const jewellers = jewellersRes.data || [];
      const proCount = items.filter(i => i.isPro).length;
      
      setStats({
        totalItems: items.length,
        totalJewellers: jewellers.length,
        proItems: proCount
      });
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, manage your catalog, jewellers, and exclusive collections.</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Catalog Items</h3>
            <p className="stat-number">{stats.totalItems}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Registered Jewellers</h3>
            <p className="stat-number">{stats.totalJewellers}</p>
          </div>
        </div>

        <Link to="/admin/items" className="action-card">
          <Grid size={40} className="action-icon" />
          <h3>Manage Items</h3>
          <p>Add, edit, or remove jewellery items and set Pro flags.</p>
        </Link>

        <Link to="/admin/settings" className="action-card">
          <SettingsIcon size={40} className="action-icon" />
          <h3>Platform Settings</h3>
          <p>Update contact information, categories, and homepage showcases.</p>
        </Link>

        {/* Section next to Platform Settings for managing Jewellers */}
        <Link to="/admin/jewellers" className="action-card action-card-highlight">
          <Users size={40} className="action-icon" />
          <h3>Manage Jewellers</h3>
          <p>Manage Jewellers Name, address, mobile & manually assign Login ID and Password.</p>
        </Link>

        {/* Pro Collection Settings */}
        <Link to="/admin/pro-settings" className="action-card action-card-pro">
          <Sparkles size={40} className="action-icon" />
          <h3>Pro Collection Settings</h3>
          <p>Manage new variety items photos, ads, and exclusive Pro banner showcase.</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
