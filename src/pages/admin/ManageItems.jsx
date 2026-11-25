import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit3, ImagePlus, X, Eye, EyeOff, Sparkles, Filter, PackageCheck } from 'lucide-react';
import api, { getImageUrl } from '../../utils/api';
import './Admin.css';

const ManageItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ 
    itemNumber: '', 
    name: '', 
    description: '', 
    weightRange: '', 
    category: 'General', 
    metal: 'Gold',
    isPro: false,
    inStock: false
  });
  const [images, setImages] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [zoomModalImg, setZoomModalImg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState(['General', 'Necklace', 'Ring', 'Bracelet', 'Earrings']);
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('all'); // 'all', 'standard', 'pro'

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
      const { data } = await api.get('/items?admin=true');
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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
    if (imagesToRemove.length > 0) {
      data.append('imagesToRemove', JSON.stringify(imagesToRemove));
    }

    try {
      if (editingId) {
        await api.put(`/items/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Item updated successfully');
      } else {
        await api.post('/items', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Item added successfully');
      }
      setFormData({ 
        itemNumber: '', 
        name: '', 
        description: '', 
        weightRange: '', 
        category: categories[0] || 'General', 
        metal: 'Gold',
        isPro: false,
        inStock: false
      });
      setImages(null);
      setExistingImages([]);
      setImagesToRemove([]);
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
    setFormData({ 
      itemNumber: item.itemNumber, 
      name: item.name, 
      description: item.description || '', 
      weightRange: item.weightRange, 
      category: item.category || (categories[0] || 'General'), 
      metal: item.metal || 'Gold',
      isPro: item.isPro || false,
      inStock: item.inStock || false
    });
    setExistingImages(item.images || []);
    setImagesToRemove([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveExistingImage = (imgToRemove, e) => {
    e.stopPropagation();
    setExistingImages(prev => prev.filter(img => img !== imgToRemove));
    setImagesToRemove(prev => [...prev, imgToRemove]);
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

  const toggleVisibility = async (item) => {
    try {
      const data = new FormData();
      data.append('isHidden', !item.isHidden);
      await api.put(`/items/${item._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(`Item ${item.isHidden ? 'shown' : 'hidden'} successfully`);
      fetchItems();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating item visibility');
      console.error('Failed to toggle visibility');
    }
  };

  const toggleProItem = async (item) => {
    try {
      const newProStatus = !item.isPro;
      const data = new FormData();
      data.append('isPro', newProStatus);
      await api.put(`/items/${item._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(`Item #${item.itemNumber} moved to ${newProStatus ? 'Pro Collection' : 'Standard Collection'}`);
      fetchItems();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating item collection type');
      console.error('Failed to toggle pro status');
    }
  };

  const toggleStockItem = async (item) => {
    try {
      const newStockStatus = !item.inStock;
      const data = new FormData();
      data.append('inStock', newStockStatus);
      await api.put(`/items/${item._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(`Item #${item.itemNumber} marked as ${newStockStatus ? 'In Stock (Available)' : 'Out of Stock / Made to Order'}`);
      fetchItems();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating item stock status');
      console.error('Failed to toggle stock status');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (collectionFilter === 'pro') return item.isPro === true;
    if (collectionFilter === 'standard') return !item.isPro;
    if (collectionFilter === 'stock') return item.inStock === true;
    return true;
  });

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <h1>Manage Jewelry Items</h1>
        <p>Add new pieces, toggle Pro / Standard collection status, and modify catalog items.</p>
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

          {/* Slider for Pro / Non-Pro Item */}
          <div className="form-group" style={{ 
            background: 'var(--bg-color)', 
            padding: '1rem', 
            borderRadius: '8px', 
            border: `1px solid ${formData.isPro ? 'var(--primary-color)' : 'var(--border-color)'}`,
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: formData.isPro ? 'var(--primary-color)' : 'var(--text-muted, #888)' }} />
                <span>Collection Classification Slider</span>
              </label>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: formData.isPro ? 'var(--primary-color)' : 'var(--text-muted, #aaa)' }}>
                {formData.isPro ? '💎 Pro Collection (Exclusive)' : 'Non-Pro (Normal Collection)'}
              </span>
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, isPro: !prev.isPro }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: formData.isPro ? 'rgba(212, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${formData.isPro ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '24px',
                padding: '3px',
                cursor: 'pointer',
                position: 'relative',
                userSelect: 'none',
                height: '36px',
                maxWidth: '320px',
                transition: 'all 0.3s ease'
              }}
              title="Click to toggle between Normal and Pro Collection"
            >
              <div style={{
                position: 'absolute',
                left: formData.isPro ? 'calc(50% + 2px)' : '3px',
                top: '3px',
                width: 'calc(50% - 5px)',
                height: '28px',
                background: formData.isPro ? 'var(--primary-color)' : '#666',
                borderRadius: '20px',
                transition: 'left 0.25s ease, background 0.25s ease',
                zIndex: 1
              }} />
              <span style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: !formData.isPro ? 700 : 500,
                color: !formData.isPro ? '#fff' : 'var(--text-muted, #aaa)',
                zIndex: 2
              }}>
                Non-Pro (Standard)
              </span>
              <span style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: formData.isPro ? 700 : 500,
                color: formData.isPro ? '#000' : 'var(--text-muted, #aaa)',
                zIndex: 2
              }}>
                💎 Pro Collection
              </span>
            </div>
            <small style={{ color: 'var(--text-muted, #888)', display: 'block', marginTop: '6px' }}>
              Items marked as "Pro Collection" are exclusively visible to verified jewellers in the Pro Collection.
            </small>
          </div>

          {/* Toggle for In Stock / Available Stock Item */}
          <div className="form-group" style={{ 
            background: 'var(--bg-color)', 
            padding: '1rem', 
            borderRadius: '8px', 
            border: `1px solid ${formData.inStock ? '#22c55e' : 'var(--border-color)'}`,
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageCheck size={18} style={{ color: formData.inStock ? '#22c55e' : 'var(--text-muted, #888)' }} />
                <span>Stock Availability (Available Stock)</span>
              </label>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: formData.inStock ? '#22c55e' : 'var(--text-muted, #aaa)' }}>
                {formData.inStock ? '✓ In Stock (Already Made)' : '○ Made to Order / Out of Stock'}
              </span>
            </div>

            <div
              onClick={() => setFormData(prev => ({ ...prev, inStock: !prev.inStock }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: formData.inStock ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${formData.inStock ? '#22c55e' : 'var(--border-color)'}`,
                borderRadius: '24px',
                padding: '3px',
                cursor: 'pointer',
                position: 'relative',
                userSelect: 'none',
                height: '36px',
                maxWidth: '320px',
                transition: 'all 0.3s ease'
              }}
              title="Click to toggle stock availability"
            >
              <div style={{
                position: 'absolute',
                left: formData.inStock ? 'calc(50% + 2px)' : '3px',
                top: '3px',
                width: 'calc(50% - 5px)',
                height: '28px',
                background: formData.inStock ? '#22c55e' : '#666',
                borderRadius: '20px',
                transition: 'left 0.25s ease, background 0.25s ease',
                zIndex: 1
              }} />
              <span style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: !formData.inStock ? 700 : 500,
                color: !formData.inStock ? '#fff' : 'var(--text-muted, #aaa)',
                zIndex: 2
              }}>
                Made to Order
              </span>
              <span style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: formData.inStock ? 700 : 500,
                color: formData.inStock ? '#000' : 'var(--text-muted, #aaa)',
                zIndex: 2
              }}>
                📦 In Stock
              </span>
            </div>
            <small style={{ color: 'var(--text-muted, #888)', display: 'block', marginTop: '6px' }}>
              Items marked as "In Stock" appear immediately when Pro Collection members switch on the "Available Stock" toggle.
            </small>
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
                  <div key={idx} style={{ position: 'relative', cursor: 'zoom-in' }} onClick={() => setZoomModalImg(getImageUrl(img))}>
                    <img src={getImageUrl(img)} alt="Existing" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                    <button type="button" onClick={(e) => handleRemoveExistingImage(img, e)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#dc3545', color: 'white', borderRadius: '50%', width: '22px', height: '22px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }} title="Delete Image">X</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update Item' : 'Add Item'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" style={{marginLeft: '10px'}} onClick={() => {setEditingId(null); setExistingImages([]); setImagesToRemove([]); setFormData({ itemNumber: '', name: '', description: '', weightRange: '', category: categories[0] || 'General', metal: 'Gold', isPro: false, inStock: false });}}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="items-list-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Current Catalog Items ({filteredItems.length})</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #888)' }}>
              Click the collection or stock badge to toggle between Standard/Pro and In Stock/Out of Stock.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Filter by collection and stock */}
            <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setCollectionFilter('all')}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: collectionFilter === 'all' ? 'var(--primary-color)' : 'transparent',
                  color: collectionFilter === 'all' ? '#000' : 'var(--text-color)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setCollectionFilter('standard')}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: collectionFilter === 'standard' ? 'var(--primary-color)' : 'transparent',
                  color: collectionFilter === 'standard' ? '#000' : 'var(--text-color)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Standard ({items.filter(i => !i.isPro).length})
              </button>
              <button
                type="button"
                onClick={() => setCollectionFilter('pro')}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: collectionFilter === 'pro' ? 'var(--primary-color)' : 'transparent',
                  color: collectionFilter === 'pro' ? '#000' : 'var(--text-color)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                💎 Pro ({items.filter(i => i.isPro).length})
              </button>
              <button
                type="button"
                onClick={() => setCollectionFilter('stock')}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: collectionFilter === 'stock' ? '#22c55e' : 'transparent',
                  color: collectionFilter === 'stock' ? '#000' : 'var(--text-color)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                📦 Is Stock ({items.filter(i => i.inStock).length})
              </button>
            </div>

            <input 
              type="text" 
              placeholder="Search by name, SKU or category..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '260px', marginBottom: '0' }}
            />
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Item No</th>
                <th>Name</th>
                <th>Weight</th>
                <th>Category</th>
                <th>Collection Type</th>
                <th>Stock Status</th>
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
                  <td>{item.category || 'General'}</td>
                  <td>
                    {/* 1-click Pro Slider Badge */}
                    <button
                      type="button"
                      onClick={() => toggleProItem(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.3rem 0.7rem',
                        borderRadius: '20px',
                        border: `1px solid ${item.isPro ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        background: item.isPro ? 'rgba(212, 175, 55, 0.2)' : 'var(--bg-color)',
                        color: item.isPro ? 'var(--primary-color)' : 'var(--text-muted, #aaa)',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Click to toggle between Pro and Standard collection"
                    >
                      <Sparkles size={13} />
                      {item.isPro ? 'PRO Item' : 'Standard'}
                    </button>
                  </td>
                  <td>
                    {/* 1-click Stock Status Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleStockItem(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.3rem 0.7rem',
                        borderRadius: '20px',
                        border: `1px solid ${item.inStock ? '#22c55e' : 'var(--border-color)'}`,
                        background: item.inStock ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-color)',
                        color: item.inStock ? '#22c55e' : 'var(--text-muted, #aaa)',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Click to toggle Available Stock (In Stock / Out of Stock)"
                    >
                      <PackageCheck size={13} />
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </td>
                  <td>
                    <button className="action-btn edit" onClick={() => editItem(item)} title="Edit Item"><Edit3 size={18} /></button>
                    <button className="action-btn" style={{ color: item.isHidden ? 'var(--text-muted)' : 'var(--primary-color)' }} onClick={() => toggleVisibility(item)} title={item.isHidden ? "Show in Catalog" : "Hide from Catalog"}>
                      {item.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button className="action-btn delete" onClick={() => deleteItem(item._id)} title="Delete Item"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {zoomModalImg && (
        <div className="zoom-modal" onClick={() => setZoomModalImg(null)}>
          <button className="close-zoom" onClick={(e) => { e.stopPropagation(); setZoomModalImg(null); }}>
            <X size={32} />
          </button>
          <img src={zoomModalImg} alt="Zoomed" className="zoomed-image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ManageItems;
