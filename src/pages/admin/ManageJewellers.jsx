import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Plus, Trash2, Edit3, Eye, EyeOff, Copy, Check, 
  ArrowLeft, Search, ShieldCheck, KeyRound, Phone, MapPin, Building, MessageCircle
} from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';

const ManageJewellers = () => {
  const navigate = useNavigate();
  const [jewellers, setJewellers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mobile: '',
    loginId: '',
    password: '',
    status: 'active'
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
    } else {
      fetchJewellers();
    }
  }, [navigate]);

  const fetchJewellers = async () => {
    try {
      const { data } = await api.get('/jewellers');
      setJewellers(data);
    } catch (err) {
      console.error('Failed to fetch jewellers:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      setError(err.response?.data?.message || 'Could not load jewellers list.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
    setShowFormPassword(true);
  };

  const handleCopy = (text, fieldKey) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const togglePasswordReveal = (id) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      if (editingId) {
        await api.put(`/jewellers/${editingId}`, formData);
        setMessage('Jeweller updated successfully!');
      } else {
        await api.post('/jewellers', formData);
        setMessage('Jeweller registered successfully!');
      }

      setFormData({
        name: '',
        address: '',
        mobile: '',
        loginId: '',
        password: '',
        status: 'active'
      });
      setEditingId(null);
      fetchJewellers();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Error saving jeweller:', err);
      let errMsg = 'Failed to save jeweller. Please verify inputs.';
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.response?.status === 404) {
        errMsg = 'API endpoint not found (404). Please ensure the backend server is running and up-to-date.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
      setTimeout(() => setError(''), 6000);
    }
  };

  const handleEdit = (jeweller) => {
    setEditingId(jeweller._id);
    setFormData({
      name: jeweller.name || '',
      address: jeweller.address || '',
      mobile: jeweller.mobile || '',
      loginId: jeweller.loginId || '',
      password: jeweller.rawPassword || '',
      status: jeweller.status || 'active'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? Their Pro Collection access will be removed.`)) {
      try {
        await api.delete(`/jewellers/${id}`);
        setMessage('Jeweller deleted successfully.');
        fetchJewellers();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }
        setError(err.response?.data?.message || 'Failed to delete jeweller.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      mobile: '',
      loginId: '',
      password: '',
      status: 'active'
    });
  };

  const handleSendWhatsApp = (jeweller) => {
    let phoneNum = (jeweller.mobile || '').replace(/[^0-9]/g, '');
    if (!phoneNum.startsWith('91') && phoneNum.length === 10) {
      phoneNum = `91${phoneNum}`;
    }

    const text = `Hey ${jeweller.name}, Your Registration in The Thushi's Pro Collection is successfully done.\n\nThis is your Login ID - ${jeweller.loginId}\nPassword - ${jeweller.rawPassword || ''}`;
    const url = phoneNum
      ? `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredJewellers = jewellers.filter(j => 
    j.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.loginId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.mobile?.includes(searchQuery) ||
    j.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-container animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/dashboard" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <div className="admin-header">
        <h1>Manage Jewellers</h1>
        <p>Register and manage jewellers name, contact, and custom Login ID & Password for Pro Collection access.</p>
      </div>

      {message && <div className="status-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Form Section */}
      <div className="form-section" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <ShieldCheck size={24} style={{ color: 'var(--primary-color)' }} />
          <h2 style={{ margin: 0 }}>{editingId ? 'Edit Jeweller Details' : 'Add New Jeweller'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={16} /> Jewellers Name / Firm Name *
              </label>
              <input 
                type="text" 
                name="name" 
                placeholder="e.g. Royal Jewellers & Sons" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={16} /> Mobile Number *
              </label>
              <input 
                type="text" 
                name="mobile" 
                placeholder="e.g. +91 9876543210" 
                value={formData.mobile} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} /> Jewellers Address
            </label>
            <textarea 
              name="address" 
              placeholder="e.g. 104 Sarafa Bazaar, Old City Market" 
              value={formData.address} 
              onChange={handleInputChange} 
              rows="2"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} /> Assigned Login ID *
              </label>
              <input 
                type="text" 
                name="loginId" 
                placeholder="e.g. royal_jewellers" 
                value={formData.loginId} 
                onChange={handleInputChange} 
                required 
                autoComplete="off"
              />
              <small style={{ color: 'var(--text-muted, #888)' }}>
                Unique username for the jeweller to log into the Pro Collection.
              </small>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={16} /> Assigned Password *
                </label>
                <button 
                  type="button" 
                  onClick={generateRandomPassword}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Generate Strong
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showFormPassword ? 'text' : 'password'} 
                  name="password" 
                  placeholder="Type jeweller password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required 
                  autoComplete="new-password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showFormPassword ? 'Hide password' : 'Show password'}
                >
                  {showFormPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <small style={{ color: 'var(--text-muted, #888)' }}>
                Admin can manually type or generate the password and view it anytime.
              </small>
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '250px' }}>
            <label>Account Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange}>
              <option value="active">Active (Can Access Pro Collection)</option>
              <option value="inactive">Inactive (Access Blocked)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> {editingId ? 'Update Jeweller' : 'Save & Register Jeweller'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Jewellers List Section */}
      <div className="items-list-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Registered Jewellers ({jewellers.length})</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted, #888)' }}>
              All authorized jewellers who have access to the Pro Collection.
            </p>
          </div>
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #888)' }} />
            <input 
              type="text" 
              placeholder="Search by name, ID, phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', marginBottom: '0' }}
            />
          </div>
        </div>

        {jewellers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
            <Users size={48} style={{ color: 'var(--primary-color)', opacity: 0.6, marginBottom: '1rem' }} />
            <h3>No Jewellers Added Yet</h3>
            <p style={{ color: 'var(--text-muted, #888)' }}>
              Add multiple jewellers using the form above. Once saved, their Login ID & Password will grant them access to Pro Collection.
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Jewellers Name</th>
                  <th>Contact & Address</th>
                  <th>Login ID</th>
                  <th>Password</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJewellers.map(jeweller => {
                  const isPassRevealed = revealedPasswords[jeweller._id];
                  const passwordToDisplay = jeweller.rawPassword || '••••••••';
                  
                  return (
                    <tr key={jeweller._id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--primary-color)' }}>✦</span>
                          <span>{jeweller.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>
                          <div style={{ fontWeight: 500 }}>{jeweller.mobile}</div>
                          {jeweller.address && (
                            <div style={{ color: 'var(--text-muted, #888)', fontSize: '0.8rem', maxWidth: '220px', whiteSpace: 'normal' }}>
                              {jeweller.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-color)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>
                          <span>{jeweller.loginId}</span>
                          <button 
                            type="button" 
                            onClick={() => handleCopy(jeweller.loginId, `id-${jeweller._id}`)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0 }}
                            title="Copy Login ID"
                          >
                            {copiedField === `id-${jeweller._id}` ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-color)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>
                          <span>{isPassRevealed ? passwordToDisplay : '••••••••'}</span>
                          <button 
                            type="button" 
                            onClick={() => togglePasswordReveal(jeweller._id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: 0 }}
                            title={isPassRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isPassRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleCopy(jeweller.rawPassword || '', `pass-${jeweller._id}`)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0 }}
                            title="Copy Password"
                          >
                            {copiedField === `pass-${jeweller._id}` ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: jeweller.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: jeweller.status === 'active' ? '#22c55e' : '#ef4444',
                          border: `1px solid ${jeweller.status === 'active' ? '#22c55e' : '#ef4444'}`
                        }}>
                          {jeweller.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            type="button"
                            className="action-btn whatsapp" 
                            onClick={() => handleSendWhatsApp(jeweller)} 
                            title="Send Login ID & Password on WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button 
                            className="action-btn edit" 
                            onClick={() => handleEdit(jeweller)} 
                            title="Edit Jeweller"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDelete(jeweller._id, jeweller.name)} 
                            title="Delete Jeweller"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageJewellers;
