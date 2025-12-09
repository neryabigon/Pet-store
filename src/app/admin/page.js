'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboard();
  }, [month, year]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
  };

  const formatPercent = (num) => {
    return num.toFixed(1) + '%';
  };

  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}>טוען...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">דשבורד</h1>
          <p className="page-subtitle">סיכום חודשי של ביצועי החנות</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="form-select" 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value))}
            style={{ width: '140px' }}
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select 
            className="form-select" 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={{ width: '100px' }}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">הכנסות החודש</div>
          <div className="stat-value number">{formatCurrency(data?.summary?.totalRevenue || 0)}</div>
          <div className={`stat-change ${data?.summary?.revenueVsTarget >= 100 ? 'positive' : 'negative'}`}>
            {formatPercent(data?.summary?.revenueVsTarget || 0)} מהיעד
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-label">רווח נקי</div>
          <div className="stat-value number">{formatCurrency(data?.summary?.netProfit || 0)}</div>
        </div>

        <div className={`stat-card ${(data?.summary?.productCostPct || 0) <= (data?.target?.productCostTargetPct || 30) ? 'success' : 'warning'}`}>
          <div className="stat-label">% עלות מוצרים (PC)</div>
          <div className="stat-value">{formatPercent(data?.summary?.productCostPct || 0)}</div>
          <div className="stat-change">יעד: {data?.target?.productCostTargetPct || 30}%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">סה"כ הוצאות</div>
          <div className="stat-value number">{formatCurrency(data?.summary?.totalExpenses || 0)}</div>
        </div>
      </div>

      {/* Revenue Progress */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">התקדמות מול יעד</h3>
          <span className="text-muted">
            יעד: {formatCurrency(data?.target?.revenueTarget || 0)}
          </span>
        </div>
        <div className="progress-bar" style={{ height: '24px', marginBottom: '12px' }}>
          <div 
            className={`progress-fill ${data?.summary?.revenueVsTarget >= 100 ? 'success' : data?.summary?.revenueVsTarget >= 70 ? '' : 'warning'}`}
            style={{ width: `${Math.min(data?.summary?.revenueVsTarget || 0, 100)}%` }}
          />
        </div>
        <div className="flex-between text-sm text-muted">
          <span>הושג: {formatCurrency(data?.summary?.totalRevenue || 0)}</span>
          <span>{formatPercent(data?.summary?.revenueVsTarget || 0)}</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Sales by Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">מכירות לפי קטגוריה</h3>
          </div>
          {data?.salesByCategory?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>קטגוריה</th>
                    <th>סכום</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.salesByCategory.map((cat) => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td className="number">{formatCurrency(cat.total)}</td>
                      <td className="number">
                        {formatPercent((cat.total / data.summary.totalRevenue) * 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>אין מכירות החודש</p>
            </div>
          )}
        </div>

        {/* Sales by User */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">מכירות לפי עובד</h3>
          </div>
          {data?.salesByUser?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>עובד</th>
                    <th>סכום</th>
                    <th>מכירות</th>
                  </tr>
                </thead>
                <tbody>
                  {data.salesByUser.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td className="number">{formatCurrency(user.total)}</td>
                      <td className="number">{user.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>אין מכירות החודש</p>
            </div>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">הוצאות לפי קטגוריה</h3>
          </div>
          {data?.expensesByCategory?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>קטגוריה</th>
                    <th>סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expensesByCategory.map((cat) => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td className="number">{formatCurrency(cat.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>אין הוצאות החודש</p>
            </div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">פירוט הוצאות</h3>
          </div>
          <div style={{ padding: '12px 0' }}>
            <div className="flex-between mb-3">
              <span>קניות מספקים</span>
              <span className="number font-bold">{formatCurrency(data?.summary?.supplierExpenses || 0)}</span>
            </div>
            <div className="flex-between mb-3">
              <span>הוצאות קבועות</span>
              <span className="number font-bold">{formatCurrency(data?.summary?.fixedExpenses || 0)}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
            <div className="flex-between">
              <span className="font-bold">סה"כ הוצאות</span>
              <span className="number font-bold">{formatCurrency(data?.summary?.totalExpenses || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid-2 mt-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">מכירות אחרונות</h3>
          </div>
          {data?.recentSales?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>תאריך</th>
                    <th>סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.date}</td>
                      <td className="number">{formatCurrency(sale.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>אין מכירות אחרונות</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">הוצאות אחרונות</h3>
          </div>
          {data?.recentExpenses?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>תאריך</th>
                    <th>סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.date}</td>
                      <td className="number">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>אין הוצאות אחרונות</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
