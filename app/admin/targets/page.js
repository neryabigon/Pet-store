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

export default function TargetsPage() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    revenue_target: '',
    product_cost_percent: '30',
    labor_cost_percent: '28',
  });
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchTargets();
  }, [selectedYear]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/targets?year=${selectedYear}`);
      const data = await res.json();
      setTargets(data.targets || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (existingTarget = null) => {
    if (existingTarget) {
      setFormData({
        year: existingTarget.year,
        month: existingTarget.month,
        revenue_target: existingTarget.revenue_target || '',
        product_cost_percent: existingTarget.product_cost_percent || '30',
        labor_cost_percent: existingTarget.labor_cost_percent || '28',
      });
    } else {
      setFormData({
        year: selectedYear,
        month: new Date().getMonth() + 1,
        revenue_target: '',
        product_cost_percent: '30',
        labor_cost_percent: '28',
      });
    }
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
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          revenue_target: parseFloat(formData.revenue_target) || 0,
          product_cost_percent: parseFloat(formData.product_cost_percent) || 30,
          labor_cost_percent: parseFloat(formData.labor_cost_percent) || 28,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בשמירה');
        return;
      }

      closeModal();
      fetchTargets();
    } catch (error) {
      setError('שגיאה בשמירה');
    }
  };

  // Fill all 12 months
  const allMonths = MONTHS.map((name, index) => {
    const existing = targets.find(t => t.month === index + 1);
    return {
      month: index + 1,
      name,
      ...existing,
    };
  });

  const totalYearTarget = targets.reduce((sum, t) => sum + (t.revenue_target || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>יעדים חודשיים</h1>
        <div className="flex gap-2 items-center">
          <select
            className="form-control"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ width: 'auto' }}
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={() => openModal()} className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            הגדר יעד
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(totalYearTarget)}</div>
          <div className="stat-label">יעד הכנסות שנתי {selectedYear}</div>
        </div>
      </div>

      {/* Targets Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">יעדים לשנת {selectedYear}</h3>
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
                  <th>חודש</th>
                  <th>יעד הכנסות</th>
                  <th>יעד % עלות מוצרים</th>
                  <th>יעד % עלות עבודה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {allMonths.map((month) => (
                  <tr key={month.month}>
                    <td className="font-medium">{month.name}</td>
                    <td className="number">
                      {month.revenue_target ? formatCurrency(month.revenue_target) : '-'}
                    </td>
                    <td className="number">
                      {month.product_cost_percent ? `${month.product_cost_percent}%` : '-'}
                    </td>
                    <td className="number">
                      {month.labor_cost_percent ? `${month.labor_cost_percent}%` : '-'}
                    </td>
                    <td>
                      <button 
                        onClick={() => openModal(month.id ? month : { year: selectedYear, month: month.month })} 
                        className="btn btn-secondary btn-sm"
                      >
                        {month.id ? 'עריכה' : 'הגדר'}
                      </button>
                    </td>
                  </tr>
                ))}
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
              <h3 className="modal-title">הגדרת יעד - {MONTHS[formData.month - 1]} {formData.year}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-error">{error}</div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">שנה</label>
                    <select
                      className="form-control"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    >
                      {[2023, 2024, 2025, 2026].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">חודש</label>
                    <select
                      className="form-control"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">יעד הכנסות (₪)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.revenue_target}
                    onChange={(e) => setFormData({ ...formData, revenue_target: e.target.value })}
                    placeholder="לדוגמה: 100000"
                    min="0"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">יעד % עלות מוצרים (FC)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.product_cost_percent}
                      onChange={(e) => setFormData({ ...formData, product_cost_percent: e.target.value })}
                      placeholder="30"
                      min="0"
                      max="100"
                    />
                    <div className="form-hint">אחוז מההכנסות שמותר להוציא על קניות מספקים</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">יעד % עלות עבודה (LC)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.labor_cost_percent}
                      onChange={(e) => setFormData({ ...formData, labor_cost_percent: e.target.value })}
                      placeholder="28"
                      min="0"
                      max="100"
                    />
                    <div className="form-hint">אחוז מההכנסות שמותר להוציא על שכר עבודה</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">שמור</button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
