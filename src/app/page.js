'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בהתחברות');
      }

      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/worker');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <div className="login-logo">
          <div className="logo-icon">🐾</div>
          <h1>חנות מספר לחיות</h1>
          <p>מערכת ניהול תקציב</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">אימייל</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="הכנס אימייל"
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label">סיסמה</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="הכנס סיסמה"
              required
              dir="ltr"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          <p>ברירת מחדל: admin@store.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
