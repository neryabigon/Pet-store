'use client';

import { useEffect, useState } from 'react';

export default function WorkerPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [todaySales, setTodaySales] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, salesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/sales?startDate=${formData.date}&endDate=${formData.date}`),
      ]);
      
      const [categoriesData, salesData] = await Promise.all([
        categoriesRes.json(),
        salesRes.json(),
      ]);
      
      setCategories(categoriesData.filter(c => c.type === 'product'));
      setTodaySales(salesData);
      
      if (categoriesData.length > 0 && !formData.categoryId) {
        const productCats = categoriesData.filter(c => c.type === 'product');
        if (productCats.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: productCats[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData(prev => ({ ...prev, amount: '', notes: '' }));
        fetchData(); // Refresh today's sales
        
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'שגיאה בשמירה');
      }
    } catch (error) {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('האם למחוק את המכירה?')) return;
    
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      alert('שגיאה במחיקה');
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
  };

  const todayTotal = todaySales.reduce((sum, s) => sum + s.amount, 0);

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}>טוען...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">הזנת מכירות</h1>
        <p className="page-subtitle">הזן את סכום המכירות היומי</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">הזנת מכירה חדשה</h3>
          </div>

          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--secondary)',
              color: 'var(--secondary)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
            }}>
              ✓ המכירה נשמרה בהצלחה!
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">סכום (₪)</label>
              <input
                type="number"
                className="form-input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                min="0"
                step="0.01"
                placeholder="הכנס סכום"
                style={{ fontSize: '24px', padding: '16px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">קטגוריה</label>
              <select
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">תאריך</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">הערות (אופציונלי)</label>
              <input
                type="text"
                className="form-input"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="הערות נוספות"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-success" 
              style={{ width: '100%', padding: '16px', fontSize: '18px' }}
              disabled={saving}
            >
              {saving ? 'שומר...' : '💾 שמור מכירה'}
            </button>
          </form>
        </div>

        <div>
          <div className="stat-card success mb-4">
            <div className="stat-label">סה"כ מכירות היום</div>
            <div className="stat-value number">{formatCurrency(todayTotal)}</div>
            <div className="stat-change">{todaySales.length} רשומות</div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">מכירות שהזנתי היום</h3>
            </div>
            
            {todaySales.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>קטגוריה</th>
                      <th>סכום</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaySales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{sale.categoryName}</td>
                        <td className="number">{formatCurrency(sale.amount)}</td>
                        <td>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(sale.id)}
                          >
                            מחק
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px' }}>
                <p>לא הזנת מכירות היום</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
