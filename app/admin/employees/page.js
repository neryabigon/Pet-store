'use client';

import { useEffect, useState } from 'react';

const ROLES = {
  admin: 'מנהל',
  shift_manager: 'אחראי משמרת',
  worker: 'עובד',
};

export default function EmployeesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'worker',
    hourly_rate: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        name: user.name,
        role: user.role,
        hourly_rate: user.hourly_rate || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'worker',
        hourly_rate: '',
      });
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'worker',
      hourly_rate: '',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!editingUser && !formData.password) {
      setError('סיסמה נדרשת למשתמש חדש');
      return;
    }

    try {
      const url = editingUser 
        ? `/api/users/${editingUser.id}` 
        : '/api/users';
      
      const payload = { ...formData };
      if (editingUser && !formData.password) {
        delete payload.password;
      }
      payload.hourly_rate = parseFloat(payload.hourly_rate) || 0;

      const res = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בשמירה');
        return;
      }

      closeModal();
      fetchUsers();
    } catch (error) {
      setError('שגיאה בשמירה');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`האם למחוק את המשתמש "${user.name}"?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'שגיאה במחיקה');
        return;
      }

      fetchUsers();
    } catch (error) {
      alert('שגיאה במחיקה');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>ניהול עובדים</h1>
        <button onClick={() => openModal()} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          הוסף עובד
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>שם</th>
                <th>שם משתמש</th>
                <th>תפקיד</th>
                <th>שכר לשעה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-secondary">
                    אין עובדים
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-primary' : user.role === 'shift_manager' ? 'badge-warning' : 'badge-success'}`}>
                        {ROLES[user.role]}
                      </span>
                    </td>
                    <td className="number">₪{user.hourly_rate || 0}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          onClick={() => openModal(user)} 
                          className="btn btn-secondary btn-sm"
                        >
                          עריכה
                        </button>
                        <button 
                          onClick={() => handleDelete(user)} 
                          className="btn btn-danger btn-sm"
                        >
                          מחיקה
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingUser ? 'עריכת עובד' : 'עובד חדש'}
              </h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-error">{error}</div>
                )}
                <div className="form-group">
                  <label className="form-label">שם מלא</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="לדוגמה: ישראל ישראלי"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">שם משתמש</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="לדוגמה: israel"
                    required
                    style={{ direction: 'ltr' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    סיסמה {editingUser && '(השאר ריק לשמור הקיימת)'}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="הזן סיסמה"
                    required={!editingUser}
                    style={{ direction: 'ltr' }}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">תפקיד</label>
                    <select
                      className="form-control"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {Object.entries(ROLES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">שכר לשעה (₪)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'שמור שינויים' : 'הוסף'}
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">
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
