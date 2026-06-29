import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../features/authSlice';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { initSocket } from '../services/socket';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick Demo Account Buttons
  const demoAccounts = [
    { role: 'Admin', email: 'admin@hfms.org', pass: 'password123' },
    { role: 'Doctor', email: 'doctor@hfms.org', pass: 'password123' },
    { role: 'Dietician', email: 'dietician@hfms.org', pass: 'password123' },
    { role: 'Patient', email: 'patient@hfms.org', pass: 'password123' },
    { role: 'Pantry Mgr', email: 'pantry@hfms.org', pass: 'password123' },
    { role: 'Delivery', email: 'delivery@hfms.org', pass: 'password123' },
  ];

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      dispatch(loginSuccess({ user: res.data.user, token: res.data.token }));
      
      initSocket();

      // Redirect based on role
      switch (res.data.user.role) {
        case UserRole.Admin:
          navigate('/admin');
          break;
        case UserRole.Doctor:
        case UserRole.Dietician:
          navigate('/doctor');
          break;
        case UserRole.Patient:
          navigate('/patient');
          break;
        case UserRole.Pantry:
          navigate('/pantry');
          break;
        case UserRole.Delivery:
          navigate('/delivery');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-brand-600 text-white rounded-2xl shadow-xl shadow-brand-900/20 mb-4">
            <Activity className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">HFMS Production MVP</h2>
          <p className="text-sm text-slate-500 mt-1">Hospital Food Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200 flex items-center gap-3 font-medium">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@hfms.org"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white py-3.5 rounded-2xl font-bold tracking-wide shadow-lg shadow-brand-900/25 transition duration-200 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider text-center mb-4">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleQuickLogin(demo.email, demo.pass)}
                className="py-2 px-3 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition text-center tracking-tight"
              >
                {demo.role}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          New Patient?{' '}
          <Link to="/register" className="text-brand-600 font-extrabold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
