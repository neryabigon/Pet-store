'use client';

import { useEffect, useState } from 'react';

export default function AdminSalesPage() {
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear]);

  const fetchData = async () => {
    try {
      const startDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(filterYear, filterMonth, 0).getDate();
      const endDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${lastDay}`;

      const [salesRes, categoriesRes, usersRes] = await Promise.all([
        fetch(`/api/sales?startDate=${startDate}&endDate=${endDate}`),
        fetch('/api/categories'),
        fetch('/api/users'),
      ]);
      
      const [salesData, categoriesData, usersData] = await Promise.all([
        salesRes.json(),
        categoriesRes.json(),
        usersRes.json(),
      ]);
      
      setSales(salesData);
      setCategories(categoriesData.filter(c => c.type === 'product'));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const filteredSales = filterUser 
    ? sales.filter(s => s.userId === filterUser)
    : sales;

  const totalSales = filteredSales.reduce((sum, s) => sum + s.amount, 0);

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}>טוען...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">מכירות</h1>
        <p className="page-subtitle">צפייה בכל המכירות שהוזנו</p>
      </div>

      <div className="card mb-4">
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">חודש</label>
            <select 
              className="form-select" 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              style={{ width: '140px' }}
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">שנה</label>
            <select 
              className="form-select" 
              value={filterYear} 
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              style={{ width: '100px' }}
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">עובד</label>
            <select 
              className="form-select" 
              value={filterUser} 
              onChange={(e) => setFilterUser(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="">כל העובדים</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card success">
          <div className="stat-label">סה"כ מכירות</div>
          <div className="stat-value number">{formatCurrency(totalSales)}</div>
          <div className="stat-change">{filteredSales.length} רשומות</div>
        </div>
      </div>

      <div className="card">
        {filteredSales.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>עובד</th>
                  <th>קטגוריה</th>
                  <th>סכום</th>
                  <th>הערות</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.date}</td>
                      <td>{sale.userName}</td>
                      <td>{sale.categoryName}</td>
                      <td className="number">{formatCurrency(sale.amount)}</td>
                      <td>{sale.notes || '-'}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sale.id)}>
                          מחק
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>אין מכירות</h3>
            <p>לא נמצאו מכירות בתקופה שנבחרה</p>
          </div>
        )}
      </div>
    </div>
  );
}
