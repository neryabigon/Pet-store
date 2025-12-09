'use client';

import { useEffect, useState } from 'react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      setSales(data.sales || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);

  // Group by category
  const salesByCategory = sales.reduce((acc, sale) => {
    if (!acc[sale.category_name]) {
      acc[sale.category_name] = 0;
    }
    acc[sale.category_name] += sale.amount;
    return acc;
  }, {});

  // Group by user
  const salesByUser = sales.reduce((acc, sale) => {
    if (!acc[sale.user_name]) {
      acc[sale.user_name] = 0;
    }
    acc[sale.user_name] += sale.amount;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>מכירות</h1>
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(totalSales)}</div>
          <div className="stat-label">סה"כ מכירות בתקופה</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sales.length}</div>
          <div className="stat-label">מספר רשומות</div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        {/* By Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">לפי קטגוריה</h3>
          </div>
          <div className="card-body">
            {Object.keys(salesByCategory).length === 0 ? (
              <p className="text-secondary">אין נתונים</p>
            ) : (
              Object.entries(salesByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([name, amount]) => (
                  <div key={name} className="flex justify-between mb-2">
                    <span>{name}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* By User */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">לפי עובד</h3>
          </div>
          <div className="card-body">
            {Object.keys(salesByUser).length === 0 ? (
              <p className="text-secondary">אין נתונים</p>
            ) : (
              Object.entries(salesByUser)
                .sort((a, b) => b[1] - a[1])
                .map(([name, amount]) => (
                  <div key={name} className="flex justify-between mb-2">
                    <span>{name}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">פירוט מכירות</h3>
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
                  <th>עובד</th>
                  <th>קטגוריה</th>
                  <th>סכום</th>
                  <th>הערות</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary">
                      אין מכירות בתקופה זו
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{new Date(sale.date).toLocaleDateString('he-IL')}</td>
                      <td>{sale.user_name}</td>
                      <td>{sale.category_name}</td>
                      <td className="number">{formatCurrency(sale.amount)}</td>
                      <td className="text-secondary">{sale.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
