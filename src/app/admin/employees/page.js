'use client';

import { useEffect, useState } from 'react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker',
    position: '',
    hourlyRate: 35,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingEmployee ? 'PUT' : 'POST';
      const body = editingEmployee 
        ? { ...formData, id: editingEmployee.id }
        : formData;

      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchEmployees();
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
    if (!confirm('האם למחוק את העובד?')) return;
    
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEmployees();
      }
    } catch (error) {
      alert('שגיאה במחיקה');
    }
  };

  const openModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        password: '',
        role: employee.role,
        position: employee.position || '',
        hourlyRate: employee.hourlyRate || 35,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'worker',
        position: '',
        hourlyRate: 35,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}>טוען...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">ניהול עובדים</h1>
          <p className="page-subtitle">הוספה ועריכה של עובדים במערכת</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + הוסף עובד
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>שם</th>
                <th>אימייל</th>
                <th>תפקיד</th>
                <th>תעריף שעתי</th>
                <th>הרשאה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <div className="user-avatar">{emp.name?.charAt(0)}</div>
                      {emp.name}
                    </div>
                  </td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{emp.email}</td>
                  <td>{emp.position || '-'}</td>
                  <td className="number">₪{emp.hourlyRate || 0}</td>
                  <td>
                    <span className={`badge ${emp.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
                      {emp.role === 'admin' ? 'מנהל' : 'עובד'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openModal(emp)}>
                        ערוך
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}>
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEmployee ? 'עריכת עובד' : 'הוספת עובד'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">שם מלא</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">אימייל</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {editingEmployee ? 'סיסמה חדשה (השאר ריק לשמירת הקיימת)' : 'סיסמה'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingEmployee}
                    dir="ltr"
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">תפקיד</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="למשל: מוכר, אחמש"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">תעריף שעתי (₪)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">הרשאה</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="worker">עובד</option>
                    <option value="admin">מנהל</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'שמור שינויים' : 'הוסף עובד'}
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
