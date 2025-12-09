'use client';

import { useEffect, useState } from 'react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('product');
  const [formData, setFormData] = useState({
    name: '',
    type: 'product',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory 
        ? { ...formData, id: editingCategory.id }
        : formData;

      const res = await fetch('/api/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchCategories();
        closeModal();
      } else {
        const data = await res.json();
        alert(data.error || 'שגיאה בשמירה');
      }
    } catch (error) {
      alert('שגיאה בשמירה');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('האם למחוק את הקטגוריה?')) return;
    
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      alert('שגיאה במחיקה');
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: activeTab,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}>טוען...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">ניהול קטגוריות</h1>
          <p className="page-subtitle">קטגוריות מוצרים והוצאות</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + הוסף קטגוריה
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'product' ? 'active' : ''}`}
          onClick={() => setActiveTab('product')}
        >
          קטגוריות מוצרים
        </button>
        <button 
          className={`tab ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('expense')}
        >
          קטגוריות הוצאות
        </button>
      </div>

      <div className="card">
        {filteredCategories.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>שם הקטגוריה</th>
                  <th>סוג</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td>
                      <span className={`badge ${cat.type === 'product' ? 'badge-success' : 'badge-warning'}`}>
                        {cat.type === 'product' ? 'מוצר' : 'הוצאה'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal(cat)}>
                          ערוך
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat.id)}>
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>אין קטגוריות</h3>
            <p>לחץ על "הוסף קטגוריה" להוספת קטגוריה חדשה</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCategory ? 'עריכת קטגוריה' : 'הוספת קטגוריה'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">שם הקטגוריה</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="למשל: מזון לכלבים"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">סוג</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="product">מוצר (למכירות)</option>
                    <option value="expense">הוצאה (לקניות/הוצאות קבועות)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'שמור שינויים' : 'הוסף קטגוריה'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
