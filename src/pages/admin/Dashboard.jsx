import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid, Settings as SettingsIcon, LogOut } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalItems: 0 });

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
    } else {
      fetchStats();
    }
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/items');
      setStats({ totalItems: data.length });
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, manage your catalog efficiently.</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Items in Catalog</h3>
            <p className="stat-number">{stats.totalItems}</p>
          </div>
        </div>

        <Link to="/admin/items" className="action-card">
          <Grid size={40} className="action-icon" />
          <h3>Manage Items</h3>
          <p>Add, edit, or remove jewellery items.</p>
        </Link>

        <Link to="/admin/settings" className="action-card">
          <SettingsIcon size={40} className="action-icon" />
          <h3>Platform Settings</h3>
          <p>Update contact information like WhatsApp & Phone.</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
