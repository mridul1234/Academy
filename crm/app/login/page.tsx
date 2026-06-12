'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import type { CrmRole } from '@/lib/types';

const defaultCredentials = {
  coach: { email: 'mridul@chessgum.com', password: '' },
  student: { email: '', password: '' },
};

export default function LoginPage() {
  const [role, setRole] = useState<CrmRole>('coach');
  const [email, setEmail] = useState(defaultCredentials.coach.email);
  const [password, setPassword] = useState(defaultCredentials.coach.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchRole(nextRole: CrmRole) {
    setRole(nextRole);
    setEmail(defaultCredentials[nextRole].email);
    setPassword(defaultCredentials[nextRole].password);
    setError('');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, email, password }),
    });

    setLoading(false);
    if (!res.ok) {
      setError('Invalid CRM login details.');
      return;
    }

    window.location.href = '/';
  }

  return (
    <main className="auth-screen">
      <form onSubmit={submit} className="auth-card">
        <p>ChessGum CRM</p>
        <h1>Sign in</h1>
        <span>Sign in to the CRM using the internal dashboard data.</span>

        <div className="auth-role-tabs">
          {(['coach', 'student'] as CrmRole[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchRole(item)}
              className={role === item ? 'auth-role-active' : ''}
            >
              {item === 'coach' ? 'Mridul' : 'Student'}
            </button>
          ))}
        </div>

        <label className="auth-field">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label className="auth-field">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? <div className="auth-error">{error}</div> : null}

        <button className="auth-submit" disabled={loading}>
          <LogIn className="h-4 w-4" />
          {loading ? 'Checking...' : `Enter as ${role}`}
        </button>
      </form>
    </main>
  );
}
