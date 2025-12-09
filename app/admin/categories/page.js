'use client';

import { useEffect, useState } from 'react';

const CATEGORY_TYPES = {
  income: 'הכנסה (מכירות)',
  expense_supplier: 'הוצאה - ספקים',
  expense_fixed: 'הוצאה - קבועה',
  expense_operational: 'הוצאה - תפעול',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'income' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, type: category.type });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', type: 'income' });
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', type: 'income' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}` 
        : '/api/categories';
      
      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בשמירה');
        return;
      }

      closeModal();
      fetchCategories();
    } catch (error) {
      setError('שגיאה בשמירה');
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`האם למחוק את הקטגוריה "${category.name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'שגיאה במחיקה');
        return;
      }

      fetchCategories();
    } catch (error) {
      alert('שגיאה במחיקה');
    }
  };

  const filteredCategories = activeTab === 'all' 
    ? categories 
    : categories.filter(c => c.type === activeTab);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>ניהול קטגוריות</h1>
        <button onClick={() => openModal()} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          הוסף קטגוריה
        </button>
      </div>

      <div className="card">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            הכל ({categories.length})
          </button>
          <button 
            className={`tab ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            הכנסות ({categories.filter(c => c.type === 'income').length})
          </button>
          <button 
            className={`tab ${activeTab === 'expense_supplier' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense_supplier')}
          >
            ספקים ({categories.filter(c => c.type === 'expense_supplier').length})
          </button>
          <button 
            className={`tab ${activeTab === 'expense_fixed' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense_fixed')}
          >
            קבועות ({categories.filter(c => c.type === 'expense_fixed').length})
          </button>
          <button 
            className={`tab ${activeTab === 'expense_operational' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense_operational')}
          >
            תפעול ({categories.filter(c => c.type === 'expense_operational').length})
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>שם</th>
                <th>סוג</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-secondary">
                    אין קטגוריות
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>
                      <span className={`badge ${category.type === 'income' ? 'badge-success' : 'badge-warning'}`}>
                        {CATEGORY_TYPES[category.type]}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          onClick={() => openModal(category)} 
                          className="btn btn-secondary btn-sm"
                        >
                          עריכה
                        </button>
                        <button 
                          onClick={() => handleDelete(category)} 
                          className="btn btn-danger btn-sm"
                        >
                          מחיקה
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCategory ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}
              </h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-error">{error}</div>
                )}
                <div className="form-group">
                  <label className="form-label">שם הקטגוריה</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="לדוגמה: מזון לכלבים"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">סוג</label>
                  <select
                    className="form-control"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {Object.entries(CATEGORY_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'שמור שינויים' : 'הוסף'}
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">
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
