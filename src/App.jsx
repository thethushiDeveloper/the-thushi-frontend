import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotepadProvider } from './context/NotepadContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingNotepad from './components/FloatingNotepad';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProCollection from './pages/ProCollection';
import ItemDetail from './pages/ItemDetail';
import About from './pages/About';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ManageItems from './pages/admin/ManageItems';
import ManageJewellers from './pages/admin/ManageJewellers';
import Settings from './pages/admin/Settings';
import ProSettings from './pages/admin/ProSettings';

function App() {
  return (
    <Router>
      <NotepadProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/pro-collection" element={<ProCollection />} />
              <Route path="/about" element={<About />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/items" element={<ManageItems />} />
              <Route path="/admin/jewellers" element={<ManageJewellers />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/pro-settings" element={<ProSettings />} />
            </Routes>
          </main>
          <Footer />
          <FloatingNotepad />
        </div>
      </NotepadProvider>
    </Router>
  );
}

export default App;
