import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Search, Copy, Check } from 'lucide-react';
import api, { getImageUrl } from '../utils/api';
import './Catalog.css';

const Catalog = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState(['Necklace', 'Ring', 'Bracelet', 'Earrings']);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyItemNo = (e, itemNumber, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(itemNumber);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const location = useLocation();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catQuery = params.get('category');
    if (catQuery && categories.includes(catQuery)) {
      setCategory(catQuery);
    } else if (params.toString() && !catQuery) {
      setCategory('');
    }
  }, [location.search, categories]);

  useEffect(() => {
    fetchItems();
  }, [search, category]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      if (data && data.length > 0) {
        const catNames = data.map(c => c.name);
        setCategories(catNames);
        
        const params = new URLSearchParams(location.search);
        const catQuery = params.get('category');
        if (!catQuery) {
           setCategory(''); // Auto-select all items
        }
      }
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const fetchItems = async () => {
    try {
      let query = '?';
      if (search) query += `search=${search}&`;
      if (category) query += `category=${category}`;
      const { data } = await api.get(`/items${query}`);
      setItems(data);
    } catch (error) {
      console.error('Failed to load catalog');
    }
  };

  return (
    <div className="catalog-container animate-fade-in">
      <div className="catalog-header">
        <h1>Our Collections</h1>
        <p>Discover our meticulously crafted pieces.</p>
      </div>

      <div className="catalog-filters">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by name or item number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-dropdown">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Items</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="catalog-grid">
        {items.length === 0 ? (
          <div className="no-items">
            <h3>No jewellery items found matching your criteria.</h3>
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              className="catalog-card"
              key={item._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
            >
              <div className="img-wrapper">
                <img
                  src={item.images[0] ? getImageUrl(item.images[0]) : 'https://via.placeholder.com/300x400?text=No+Image'}
                  alt={item.name}
                />
              </div>
              <div className="card-body">
                <h3>{item.name}</h3>
                <span
                  className="badge badge-copyable"
                  onClick={(e) => handleCopyItemNo(e, item.itemNumber, item._id)}
                  title="Click to copy item number"
                >
                  {copiedId === item._id ? <Check size={12} /> : <Copy size={12} />}
                  Item No: {item.itemNumber}
                  {copiedId === item._id && <span className="copied-label"> Copied!</span>}
                </span>
                <p className="weight-range" style={{ fontSize: '0.9rem', color: 'var(--text-color)', opacity: 0.8, marginBottom: '0.2rem' }}>Weight: {item.weightRange}</p>
                <p className="weight-range" style={{ fontSize: '0.9rem', color: 'var(--text-color)', opacity: 0.8, marginBottom: '1rem' }}>Metal: {item.metal || 'Gold'}</p>
                <Link to={`/item/${item._id}`} className="btn btn-outline full-width">
                  View Details
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Catalog;
