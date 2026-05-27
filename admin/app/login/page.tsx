'use client';

import { useState } from 'react';
import { Lock, LogIn, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.get('username'), password: form.get('password') }),
    });
    setLoading(false);
    if (res.ok) router.push('/');
    else setError('Incorrect username or password.');
  }

  return (
    <main className="grid min-h-screen place-items-center bg-navy px-4">
      <form onSubmit={submit} className={`card w-full max-w-md p-8 ${error ? 'animate-pulse' : ''}`}>
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/chessgum_logo.png" alt="ChessGum" className="mb-4 h-16 w-16 rounded-lg" />
          <h1 className="text-2xl font-extrabold">ChessGum Admin</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Sign in to your command center</p>
        </div>
        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Username</span>
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-400" size={17} />
            <input name="username" className="input pl-10" defaultValue="admin" autoComplete="username" />
          </div>
        </label>
        <label className="mb-5 block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Password</span>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={17} />
            <input name="password" type="password" className="input pl-10" autoComplete="current-password" />
          </div>
        </label>
        {error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
        <button disabled={loading} className="btn btn-primary w-full" type="submit">
          <LogIn size={16} /> {loading ? 'Checking...' : 'Enter Dashboard'}
        </button>
      </form>
    </main>
  );
}
