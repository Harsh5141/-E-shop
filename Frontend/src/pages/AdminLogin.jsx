import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password, { adminOnly: true, redirectTo: '/admin' });
  };

  return (
    <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-2xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">
          <ShieldCheck size={16} />
          Admin Access
        </div>
        <h1 className="max-w-xl text-4xl font-black leading-tight sm:text-5xl">
          Control products, users, orders, and categories from one dashboard.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
          This portal is only for store administrators. Sign in with your admin account to manage inventory,
          user access, and storefront content.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Inventory</p>
            <p className="mt-2 text-sm text-slate-300">Create, edit, and remove products with category assignment.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Users</p>
            <p className="mt-2 text-sm text-slate-300">Review users, update roles, and remove non-admin accounts.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
            <LockKeyhole size={22} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900">Admin Login</h2>
            <p className="text-sm text-slate-500">Use an account with the Admin role.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-cyan-600"
          >
            Sign In To Admin Dashboard
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm text-slate-500">
          <p>
            Need the customer portal?{' '}
            <Link to="/login" className="font-semibold text-cyan-700 hover:text-cyan-600">
              Go to normal login
            </Link>
          </p>
          <p>
            Need a new account?{' '}
            <Link to="/register" className="font-semibold text-cyan-700 hover:text-cyan-600">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
