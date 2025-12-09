'use client';

import { useEffect, useState } from 'react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingSupplier ? 'PUT' : 'POST';
      const body = editingSupplier 
        ? { ...formData, id: editingSupplier.id }
        : formData;

      const res = await fetch('/api/suppliers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchSuppliers();
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
    if (!confirm('האם למחוק את הספק?')) return;
    
    try {
      const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSuppliers();
      }
    } catch (error) {
      alert('שגיאה במחיקה');
    }
  };

  const openModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone || '',
        email: supplier.email || '',
        notes: supplier.notes || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}>טוען...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">ניהול ספקים</h1>
          <p className="page-subtitle">רשימת ספקי החנות</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + הוסף ספק
        </button>
      </div>

      <div className="card">
        {suppliers.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>שם הספק</th>
                  <th>טלפון</th>
                  <th>אימייל</th>
                  <th>הערות</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((sup) => (
                  <tr key={sup.id}>
                    <td>{sup.name}</td>
                    <td dir="ltr" style={{ textAlign: 'right' }}>{sup.phone || '-'}</td>
                    <td dir="ltr" style={{ textAlign: 'right' }}>{sup.email || '-'}</td>
                    <td>{sup.notes || '-'}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal(sup)}>
                          ערוך
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sup.id)}>
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
            <h3>אין ספקים</h3>
            <p>לחץ על "הוסף ספק" להוספת ספק חדש</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingSupplier ? 'עריכת ספק' : 'הוספת ספק'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">שם הספק</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">טלפון</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">אימייל</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">הערות</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="הערות נוספות (אופציונלי)"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingSupplier ? 'שמור שינויים' : 'הוסף ספק'}
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
