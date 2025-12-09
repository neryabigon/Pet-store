'use client';

import { useEffect, useState } from 'react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    supplier_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expensesRes, categoriesRes, suppliersRes] = await Promise.all([
        fetch(`/api/expenses?start=${startDate}&end=${endDate}`),
        fetch('/api/categories'),
        fetch('/api/suppliers'),
      ]);
      
      const expensesData = await expensesRes.json();
      const categoriesData = await categoriesRes.json();
      const suppliersData = await suppliersRes.json();
      
      setExpenses(expensesData.expenses || []);
      setCategories(categoriesData.categories?.filter(c => c.type.startsWith('expense_')) || []);
      setSuppliers(suppliersData.suppliers || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({
      category_id: categories[0]?.id || '',
      supplier_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          supplier_id: formData.supplier_id || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בשמירה');
        return;
      }

      closeModal();
      fetchData();
    } catch (error) {
      setError('שגיאה בשמירה');
    }
  };

  const handleDelete = async (expense) => {
    if (!confirm('האם למחוק הוצאה זו?')) return;

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'שגיאה במחיקה');
        return;
      }

      fetchData();
    } catch (error) {
      alert('שגיאה במחיקה');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by type
  const expensesByType = {
    expense_supplier: expenses.filter(e => e.category_type === 'expense_supplier').reduce((sum, e) => sum + e.amount, 0),
    expense_fixed: expenses.filter(e => e.category_type === 'expense_fixed').reduce((sum, e) => sum + e.amount, 0),
    expense_operational: expenses.filter(e => e.category_type === 'expense_operational').reduce((sum, e) => sum + e.amount, 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>הוצאות</h1>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: 'auto' }}
          />
          <span>עד</span>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: 'auto' }}
          />
          <button onClick={openModal} className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            הוסף הוצאה
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(totalExpenses)}</div>
          <div className="stat-label">סה"כ הוצאות</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(expensesByType.expense_supplier)}</div>
          <div className="stat-label">קניות מספקים</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(expensesByType.expense_fixed)}</div>
          <div className="stat-label">הוצאות קבועות</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(expensesByType.expense_operational)}</div>
          <div className="stat-label">הוצאות תפעול</div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">פירוט הוצאות</h3>
        </div>
        <div className="table-container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>קטגוריה</th>
                  <th>ספק</th>
                  <th>סכום</th>
                  <th>הערות</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary">
                      אין הוצאות בתקופה זו
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.date).toLocaleDateString('he-IL')}</td>
                      <td>{expense.category_name}</td>
                      <td>{expense.supplier_name || '-'}</td>
                      <td className="number">{formatCurrency(expense.amount)}</td>
                      <td className="text-secondary">{expense.notes || '-'}</td>
                      <td>
                        <button 
                          onClick={() => handleDelete(expense)} 
                          className="btn btn-danger btn-sm"
                        >
                          מחיקה
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">הוצאה חדשה</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-error">{error}</div>
                )}
                <div className="form-group">
                  <label className="form-label">קטגוריה</label>
                  <select
                    className="form-control"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                  >
                    <option value="">בחר קטגוריה</option>
                    <optgroup label="קניות מספקים">
                      {categories.filter(c => c.type === 'expense_supplier').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="הוצאות קבועות">
                      {categories.filter(c => c.type === 'expense_fixed').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="הוצאות תפעול">
                      {categories.filter(c => c.type === 'expense_operational').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ספק (אופציונלי)</label>
                  <select
                    className="form-control"
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  >
                    <option value="">ללא ספק</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">סכום (₪)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">תאריך</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">הערות (אופציונלי)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="הערות נוספות"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">הוסף</button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
