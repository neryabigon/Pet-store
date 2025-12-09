'use client';

import { useEffect, useState } from 'react';

export default function TargetsPage() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    revenueTarget: 50000,
    productCostTargetPct: 30,
    laborCostTargetPct: 28,
  });

  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  useEffect(() => {
    fetchTargets();
  }, []);

  useEffect(() => {
    const target = targets.find(t => t.month === selectedMonth && t.year === selectedYear);
    if (target) {
      setFormData({
        revenueTarget: target.revenueTarget,
        productCostTargetPct: target.productCostTargetPct,
        laborCostTargetPct: target.laborCostTargetPct,
      });
    } else {
      setFormData({
        revenueTarget: 50000,
        productCostTargetPct: 30,
        laborCostTargetPct: 28,
      });
    }
  }, [selectedMonth, selectedYear, targets]);

  const fetchTargets = async () => {
    try {
      const res = await fetch('/api/budget-targets');
      const data = await res.json();
      setTargets(data);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/budget-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          ...formData,
        }),
      });

      if (res.ok) {
        fetchTargets();
        alert('היעדים נשמרו בהצלחה!');
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

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
  };

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}>טוען...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">הגדרת יעדים</h1>
        <p className="page-subtitle">הגדרת יעדי הכנסות ואחוזי עלויות</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">יעדים לחודש</h3>
          </div>
          
          <div className="flex gap-2 mb-4">
            <select 
              className="form-select" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select 
              className="form-select" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ width: '120px' }}
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">יעד הכנסות (₪)</label>
              <input
                type="number"
                className="form-input"
                value={formData.revenueTarget}
                onChange={(e) => setFormData({ ...formData, revenueTarget: parseFloat(e.target.value) })}
                min="0"
                step="1000"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">יעד % עלות מוצרים (PC)</label>
              <input
                type="number"
                className="form-input"
                value={formData.productCostTargetPct}
                onChange={(e) => setFormData({ ...formData, productCostTargetPct: parseFloat(e.target.value) })}
                min="0"
                max="100"
                step="0.5"
              />
              <p className="text-sm text-muted mt-2">
                אחוז עלות הסחורה מתוך ההכנסות (מומלץ: 25-35%)
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label">יעד % עלות עבודה (LC)</label>
              <input
                type="number"
                className="form-input"
                value={formData.laborCostTargetPct}
                onChange={(e) => setFormData({ ...formData, laborCostTargetPct: parseFloat(e.target.value) })}
                min="0"
                max="100"
                step="0.5"
              />
              <p className="text-sm text-muted mt-2">
                אחוז עלות העבודה מתוך ההכנסות (מומלץ: 25-30%)
              </p>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'שומר...' : 'שמור יעדים'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">יעדים קיימים</h3>
          </div>
          
          {targets.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>חודש</th>
                    <th>יעד הכנסות</th>
                    <th>PC%</th>
                    <th>LC%</th>
                  </tr>
                </thead>
                <tbody>
                  {targets
                    .sort((a, b) => (b.year - a.year) || (b.month - a.month))
                    .map((target) => (
                      <tr 
                        key={target.id}
                        style={{ 
                          cursor: 'pointer',
                          background: target.month === selectedMonth && target.year === selectedYear 
                            ? 'var(--bg-tertiary)' 
                            : undefined 
                        }}
                        onClick={() => {
                          setSelectedMonth(target.month);
                          setSelectedYear(target.year);
                        }}
                      >
                        <td>{months[target.month - 1]} {target.year}</td>
                        <td className="number">{formatCurrency(target.revenueTarget)}</td>
                        <td>{target.productCostTargetPct}%</td>
                        <td>{target.laborCostTargetPct}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>לא הוגדרו יעדים עדיין</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
