import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit3, ImagePlus } from 'lucide-react';
import api, { getImageUrl } from '../../utils/api';
import './Admin.css';

const ManageItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ itemNumber: '', name: '', description: '', weightRange: '', category: 'General', metal: 'Gold' });
  const [images, setImages] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState(['General', 'Necklace', 'Ring', 'Bracelet', 'Earrings']);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) navigate('/admin/login');
    else {
      fetchItems();
      fetchCategories();
    }
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      if (data && data.length > 0) {
        const catNames = data.map(c => c.name);
        setCategories(catNames);
        setFormData(prev => ({ ...prev, category: catNames[0] }));
      } else {
        setCategories(['General']);
      }
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/items');
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => setImages(e.target.files);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (images) {
      for (let i = 0; i < images.length; i++) {
        data.append('images', images[i]);
      }
    }

    try {
      if (editingId) {
        await api.put(`/items/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Item updated successfully');
      } else {
        await api.post('/items', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Item added successfully');
      }
      setFormData({ itemNumber: '', name: '', description: '', weightRange: '', category: categories[0] || 'General', metal: 'Gold' });
      setImages(null);
      setExistingImages([]);
      setEditingId(null);
      fetchItems();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving item');
      console.error(error);
    }
  };

  const editItem = (item) => {
    setEditingId(item._id);
    setFormData({ itemNumber: item.itemNumber, name: item.name, description: item.description, weightRange: item.weightRange, category: item.category || (categories[0] || 'General'), metal: item.metal || 'Gold' });
    setExistingImages(item.images || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/items/${id}`);
        fetchItems();
      } catch (error) {
        console.error('Failed to delete item');
      }
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <h1>Manage Jewelry Items</h1>
        <p>Add new pieces or modify existing ones in your catalog.</p>
      </div>

      {message && <div className="status-message">{message}</div>}

      <div className="form-section">
        <h2>{editingId ? 'Edit Item' : 'Add New Item'}</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Item Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Item Number (SKU)</label>
              <input type="text" name="itemNumber" value={formData.itemNumber} onChange={handleInputChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Weight Range</label>
              <input type="text" name="weightRange" placeholder="e.g. 10g - 15g" value={formData.weightRange} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Metal Config</label>
              <select name="metal" value={formData.metal} onChange={handleInputChange} required>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Platinum">Platinum</option>
                <option value="Rose Gold">Rose Gold</option>
                <option value="White Gold">White Gold</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"></textarea>
          </div>
          <div className="form-group">
            <label>Images {editingId && '(Select new images to replace existing)'}</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="file-input" />
            {editingId && existingImages.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                {existingImages.map((img, idx) => (
                  <img key={idx} src={getImageUrl(img)} alt="Existing" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update Item' : 'Add Item'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" style={{marginLeft: '10px'}} onClick={() => {setEditingId(null); setExistingImages([]); setFormData({ itemNumber: '', name: '', description: '', weightRange: '', category: categories[0] || 'General', metal: 'Gold' });}}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="items-list-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Current Catalog Items</h2>
          <input 
            type="text" 
            placeholder="Search by name, SKU or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '300px', marginBottom: '0' }}
          />
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Item No</th>
                <th>Name</th>
                <th>Weight</th>
                <th>Metal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item._id}>
                  <td>
                    <img src={item.images[0] ? getImageUrl(item.images[0]) : '/placeholder.jpg'} alt={item.name} className="table-img"/>
                  </td>
                  <td>#{item.itemNumber}</td>
                  <td>{item.name}</td>
                  <td>{item.weightRange}</td>
                  <td>{item.metal || 'Gold'}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => editItem(item)}><Edit3 size={18} /></button>
                    <button className="action-btn delete" onClick={() => deleteItem(item._id)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageItems;
