'use client';

import { useEffect, useState } from 'react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [activeTab, setActiveTab] = useState('supplier');
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'supplier',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, categoriesRes, suppliersRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/categories'),
        fetch('/api/suppliers'),
      ]);
      
      const [expensesData, categoriesData, suppliersData] = await Promise.all([
        expensesRes.json(),
        categoriesRes.json(),
        suppliersRes.json(),
      ]);
      
      setExpenses(expensesData);
      setCategories(categoriesData.filter(c => c.type === 'expense'));
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingExpense ? 'PUT' : 'POST';
      const body = editingExpense 
        ? { ...formData, id: editingExpense.id }
        : formData;

      const res = await fetch('/api/expenses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
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
    if (!confirm('האם למחוק את ההוצאה?')) return;
    
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      alert('שגיאה במחיקה');
    }
  };

  const openModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        amount: expense.amount,
        categoryId: expense.categoryId,
        supplierId: expense.supplierId || '',
        date: expense.date,
        description: expense.description || '',
        type: expense.type || 'supplier',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        amount: '',
        categoryId: categories[0]?.id || '',
        supplierId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: activeTab,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
  };

  const filteredExpenses = expenses.filter(e => e.type === activeTab);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}>טוען...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">ניהול הוצאות</h1>
          <p className="page-subtitle">קניות מספקים והוצאות קבועות</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + הוסף הוצאה
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'supplier' ? 'active' : ''}`}
          onClick={() => setActiveTab('supplier')}
        >
          קניות מספקים
        </button>
        <button 
          className={`tab ${activeTab === 'fixed' ? 'active' : ''}`}
          onClick={() => setActiveTab('fixed')}
        >
          הוצאות קבועות
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">סה"כ {activeTab === 'supplier' ? 'קניות' : 'הוצאות קבועות'}</div>
          <div className="stat-value number">{formatCurrency(totalExpenses)}</div>
        </div>
      </div>

      <div className="card">
        {filteredExpenses.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>קטגוריה</th>
                  {activeTab === 'supplier' && <th>ספק</th>}
                  <th>סכום</th>
                  <th>תיאור</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.date}</td>
                    <td>{expense.categoryName}</td>
                    {activeTab === 'supplier' && <td>{expense.supplierName || '-'}</td>}
                    <td className="number">{formatCurrency(expense.amount)}</td>
                    <td>{expense.description || '-'}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal(expense)}>
                          ערוך
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(expense.id)}>
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
            <h3>אין הוצאות</h3>
            <p>לחץ על "הוסף הוצאה" להוספת הוצאה חדשה</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingExpense ? 'עריכת הוצאה' : 'הוספת הוצאה'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">סוג הוצאה</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="supplier">קניה מספק</option>
                    <option value="fixed">הוצאה קבועה</option>
                  </select>
                </div>
                <div className="grid-2">
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
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">תאריך</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">קטגוריה</label>
                  <select
                    className="form-select"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="">בחר קטגוריה</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {formData.type === 'supplier' && (
                  <div className="form-group">
                    <label className="form-label">ספק</label>
                    <select
                      className="form-select"
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    >
                      <option value="">בחר ספק (אופציונלי)</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">תיאור</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="תיאור קצר (אופציונלי)"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? 'שמור שינויים' : 'הוסף הוצאה'}
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
