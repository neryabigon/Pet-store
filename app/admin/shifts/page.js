'use client';

import { useEffect, useState } from 'react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
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
      const [shiftsRes, usersRes] = await Promise.all([
        fetch(`/api/shifts?start=${startDate}&end=${endDate}`),
        fetch('/api/users'),
      ]);
      
      const shiftsData = await shiftsRes.json();
      const usersData = await usersRes.json();
      
      setShifts(shiftsData.shifts || []);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({
      user_id: users[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      hours: '',
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
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hours: parseFloat(formData.hours),
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

  const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);
  const totalCost = shifts.reduce((sum, s) => sum + (s.hours * s.hourly_rate), 0);

  // Group by user
  const shiftsByUser = shifts.reduce((acc, shift) => {
    if (!acc[shift.user_name]) {
      acc[shift.user_name] = { hours: 0, cost: 0 };
    }
    acc[shift.user_name].hours += shift.hours;
    acc[shift.user_name].cost += shift.hours * shift.hourly_rate;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>משמרות ושעות עבודה</h1>
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
            הוסף משמרת
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-value">{totalHours.toFixed(1)}</div>
          <div className="stat-label">סה"כ שעות</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(totalCost)}</div>
          <div className="stat-label">עלות עבודה</div>
        </div>
      </div>

      {/* By User Summary */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">סיכום לפי עובד</h3>
        </div>
        <div className="card-body">
          {Object.keys(shiftsByUser).length === 0 ? (
            <p className="text-secondary">אין נתונים</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>עובד</th>
                    <th>שעות</th>
                    <th>עלות</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(shiftsByUser).map(([name, data]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td className="number">{data.hours.toFixed(1)}</td>
                      <td className="number">{formatCurrency(data.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Shifts Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">פירוט משמרות</h3>
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
                  <th>שעות</th>
                  <th>תעריף</th>
                  <th>עלות</th>
                </tr>
              </thead>
              <tbody>
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary">
                      אין משמרות בתקופה זו
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => (
                    <tr key={shift.id}>
                      <td>{new Date(shift.date).toLocaleDateString('he-IL')}</td>
                      <td>{shift.user_name}</td>
                      <td className="number">{shift.hours}</td>
                      <td className="number">₪{shift.hourly_rate}/שעה</td>
                      <td className="number">{formatCurrency(shift.hours * shift.hourly_rate)}</td>
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
              <h3 className="modal-title">משמרת חדשה</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-error">{error}</div>
                )}
                <div className="form-group">
                  <label className="form-label">עובד</label>
                  <select
                    className="form-control"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    required
                  >
                    <option value="">בחר עובד</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} (₪{user.hourly_rate}/שעה)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
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
                  <div className="form-group">
                    <label className="form-label">שעות</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      placeholder="8"
                      min="0"
                      step="0.5"
                      required
                    />
                  </div>
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
