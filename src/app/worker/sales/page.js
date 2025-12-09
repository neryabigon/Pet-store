'use client';

import { useEffect, useState } from 'react';

export default function WorkerSalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  useEffect(() => {
    fetchSales();
  }, [filterMonth, filterYear]);

  const fetchSales = async () => {
    try {
      const startDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(filterYear, filterMonth, 0).getDate();
      const endDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${lastDay}`;

      const res = await fetch(`/api/sales?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
  };

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);

  // Group by date
  const salesByDate = sales.reduce((acc, sale) => {
    if (!acc[sale.date]) {
      acc[sale.date] = { sales: [], total: 0 };
    }
    acc[sale.date].sales.push(sale);
    acc[sale.date].total += sale.amount;
    return acc;
  }, {});

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}>טוען...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">המכירות שלי</h1>
        <p className="page-subtitle">היסטוריית המכירות שהזנת</p>
      </div>

      <div className="card mb-4">
        <div className="flex gap-3">
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
        </div>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card success">
          <div className="stat-label">סה"כ מכירות בחודש</div>
          <div className="stat-value number">{formatCurrency(totalSales)}</div>
          <div className="stat-change">{sales.length} רשומות</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ממוצע יומי</div>
          <div className="stat-value number">
            {formatCurrency(Object.keys(salesByDate).length > 0 ? totalSales / Object.keys(salesByDate).length : 0)}
          </div>
          <div className="stat-change">{Object.keys(salesByDate).length} ימי עבודה</div>
        </div>
      </div>

      <div className="card">
        {Object.keys(salesByDate).length > 0 ? (
          <div>
            {Object.entries(salesByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, data]) => (
                <div key={date} style={{ borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
                  <div className="flex-between mb-3">
                    <span className="font-bold">{date}</span>
                    <span className="badge badge-success">{formatCurrency(data.total)}</span>
                  </div>
                  <div style={{ paddingRight: '16px' }}>
                    {data.sales.map((sale) => (
                      <div key={sale.id} className="flex-between text-sm mb-2">
                        <span className="text-muted">{sale.categoryName}</span>
                        <span className="number">{formatCurrency(sale.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>אין מכירות</h3>
            <p>לא נמצאו מכירות בחודש שנבחר</p>
          </div>
        )}
      </div>
    </div>
  );
}
