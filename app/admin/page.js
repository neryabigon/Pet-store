'use client';

import { useEffect, useState } from 'react';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function formatCurrency(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchDashboard();
  }, [year, month]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?year=${year}&month=${month}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const { summary, revenueByCategory, expensesByCategory, dailyRevenue, topSuppliers } = data;
  const target = summary.target;

  const revenueProgress = target?.revenue_target 
    ? Math.min((summary.totalRevenue / target.revenue_target) * 100, 100) 
    : 0;
  
  const productCostStatus = target?.product_cost_percent 
    ? parseFloat(summary.productCostPercent) <= target.product_cost_percent ? 'green' : 'red'
    : 'blue';
  
  const laborCostStatus = target?.labor_cost_percent 
    ? parseFloat(summary.laborCostPercent) <= target.labor_cost_percent ? 'green' : 'red'
    : 'blue';

  const totalExpenses = summary.supplierExpenses + summary.fixedExpenses + summary.operationalExpenses + summary.laborCosts;
  const netProfit = summary.totalRevenue - totalExpenses;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>דשבורד - {MONTHS[month - 1]} {year}</h1>
        <div className="flex gap-2">
          <select
            className="form-control"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            style={{ width: 'auto' }}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="form-control"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={{ width: 'auto' }}
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{formatCurrency(summary.totalRevenue)}</div>
          <div className="stat-label">הכנסות</div>
          {target?.revenue_target > 0 && (
            <>
              <div className="progress">
                <div 
                  className={`progress-bar ${revenueProgress >= 100 ? 'green' : 'blue'}`}
                  style={{ width: `${revenueProgress}%` }}
                ></div>
              </div>
              <div className="stat-change">
                {revenueProgress.toFixed(0)}% מיעד {formatCurrency(target.revenue_target)}
              </div>
            </>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{formatCurrency(summary.supplierExpenses)}</div>
          <div className="stat-label">קניות מספקים</div>
          <div className={`stat-change ${productCostStatus === 'green' ? 'positive' : productCostStatus === 'red' ? 'negative' : ''}`}>
            {summary.productCostPercent}% מההכנסות
            {target?.product_cost_percent && ` (יעד: ${target.product_cost_percent}%)`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{formatCurrency(summary.laborCosts)}</div>
          <div className="stat-label">עלות עבודה</div>
          <div className={`stat-change ${laborCostStatus === 'green' ? 'positive' : laborCostStatus === 'red' ? 'negative' : ''}`}>
            {summary.laborCostPercent}% מההכנסות
            {target?.labor_cost_percent && ` (יעד: ${target.labor_cost_percent}%)`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className={`stat-icon ${netProfit >= 0 ? 'green' : 'red'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{formatCurrency(netProfit)}</div>
          <div className="stat-label">רווח נקי</div>
          <div className={`stat-change ${netProfit >= 0 ? 'positive' : 'negative'}`}>
            הכנסות: {formatCurrency(summary.totalRevenue)} | הוצאות: {formatCurrency(totalExpenses)}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2 mb-4">
        {/* Revenue by Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">הכנסות לפי קטגוריה</h3>
          </div>
          <div className="card-body">
            {revenueByCategory.length === 0 || revenueByCategory.every(c => c.total === 0) ? (
              <div className="empty-state">
                <p>אין נתונים לתקופה זו</p>
              </div>
            ) : (
              <div>
                {revenueByCategory.filter(c => c.total > 0).map((cat, i) => (
                  <div key={i} style={{ marginBottom: '1rem' }}>
                    <div className="flex justify-between mb-1">
                      <span>{cat.name}</span>
                      <span className="font-medium">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="progress">
                      <div 
                        className="progress-bar blue"
                        style={{ width: `${(cat.total / summary.totalRevenue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">פירוט הוצאות</h3>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '1rem' }}>
              <div className="flex justify-between mb-1">
                <span>קניות מספקים</span>
                <span className="font-medium">{formatCurrency(summary.supplierExpenses)}</span>
              </div>
              <div className="progress">
                <div 
                  className="progress-bar orange"
                  style={{ width: `${totalExpenses > 0 ? (summary.supplierExpenses / totalExpenses) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div className="flex justify-between mb-1">
                <span>הוצאות קבועות</span>
                <span className="font-medium">{formatCurrency(summary.fixedExpenses)}</span>
              </div>
              <div className="progress">
                <div 
                  className="progress-bar blue"
                  style={{ width: `${totalExpenses > 0 ? (summary.fixedExpenses / totalExpenses) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div className="flex justify-between mb-1">
                <span>הוצאות תפעול</span>
                <span className="font-medium">{formatCurrency(summary.operationalExpenses)}</span>
              </div>
              <div className="progress">
                <div 
                  className="progress-bar green"
                  style={{ width: `${totalExpenses > 0 ? (summary.operationalExpenses / totalExpenses) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>עלות עבודה</span>
                <span className="font-medium">{formatCurrency(summary.laborCosts)}</span>
              </div>
              <div className="progress">
                <div 
                  className="progress-bar red"
                  style={{ width: `${totalExpenses > 0 ? (summary.laborCosts / totalExpenses) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between">
                <span className="font-bold">סה"כ הוצאות</span>
                <span className="font-bold">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Daily Revenue */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">הכנסות יומיות</h3>
          </div>
          <div className="card-body">
            {dailyRevenue.length === 0 ? (
              <div className="empty-state">
                <p>אין נתונים לתקופה זו</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>סכום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRevenue.slice(0, 10).map((day, i) => (
                      <tr key={i}>
                        <td>{new Date(day.date).toLocaleDateString('he-IL')}</td>
                        <td className="number">{formatCurrency(day.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">ספקים מובילים</h3>
          </div>
          <div className="card-body">
            {topSuppliers.length === 0 || topSuppliers.every(s => s.total === 0) ? (
              <div className="empty-state">
                <p>אין נתונים לתקופה זו</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ספק</th>
                      <th>סכום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSuppliers.filter(s => s.total > 0).map((supplier, i) => (
                      <tr key={i}>
                        <td>{supplier.name}</td>
                        <td className="number">{formatCurrency(supplier.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
