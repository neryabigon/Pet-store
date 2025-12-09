'use client';

import { useEffect, useState } from 'react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function WorkerPage() {
  const [categories, setCategories] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, salesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/sales?start=${selectedDate}&end=${selectedDate}`),
      ]);
      
      const categoriesData = await categoriesRes.json();
      const salesData = await salesRes.json();
      
      const incomeCategories = categoriesData.categories?.filter(c => c.type === 'income') || [];
      setCategories(incomeCategories);
      setSales(salesData.sales || []);
      
      // Initialize form with existing sales for this date
      const initialForm = {};
      incomeCategories.forEach(cat => {
        const existingSale = salesData.sales?.find(s => s.category_id === cat.id);
        initialForm[cat.id] = existingSale?.amount || '';
      });
      setFormData(initialForm);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Submit each category that has a value
      const promises = Object.entries(formData)
        .filter(([_, amount]) => amount !== '' && parseFloat(amount) > 0)
        .map(([categoryId, amount]) => 
          fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category_id: parseInt(categoryId),
              amount: parseFloat(amount),
              date: selectedDate,
            }),
          })
        );

      await Promise.all(promises);
      
      setMessage({ type: 'success', text: 'המכירות נשמרו בהצלחה!' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'שגיאה בשמירת המכירות' });
    } finally {
      setSaving(false);
    }
  };

  const totalToday = Object.values(formData).reduce((sum, val) => {
    const num = parseFloat(val);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  // Get this week's sales
  const getWeekStart = () => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
  };

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
        <h1>הזנת מכירות יומיות</h1>
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'} mb-4`}>
          {message.text}
        </div>
      )}

      {/* Today's Total */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalToday)}</div>
          <div className="stat-label">סה"כ מכירות ליום {new Date(selectedDate).toLocaleDateString('he-IL')}</div>
        </div>
      </div>

      {/* Sales Form */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">הזן סכום מכירות לכל קטגוריה</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-body">
            {categories.length === 0 ? (
              <div className="empty-state">
                <p>אין קטגוריות להזנה</p>
              </div>
            ) : (
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                {categories.map((category) => (
                  <div key={category.id} className="form-group">
                    <label className="form-label">{category.name}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="form-control"
                        value={formData[category.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [category.id]: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="1"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <span style={{ 
                        position: 'absolute', 
                        right: '0.75rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem'
                      }}>₪</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--background)' }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-secondary">סה"כ: </span>
                <span className="font-bold" style={{ fontSize: '1.25rem' }}>{formatCurrency(totalToday)}</span>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-lg"
                disabled={saving || totalToday === 0}
              >
                {saving ? 'שומר...' : 'שמור מכירות'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Recent Sales */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">המכירות שלי היום</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>קטגוריה</th>
                <th>סכום</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center text-secondary">
                    אין מכירות להיום
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.category_name}</td>
                    <td className="number">{formatCurrency(sale.amount)}</td>
                  </tr>
                ))
              )}
              {sales.length > 0 && (
                <tr style={{ background: 'var(--background)' }}>
                  <td className="font-bold">סה"כ</td>
                  <td className="number font-bold">
                    {formatCurrency(sales.reduce((sum, s) => sum + s.amount, 0))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
