import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HeartPulse, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useLoginMutation, useResendVerificationMutation } from '../services/api';
import { setCredentials } from '../features/auth/authSlice';
import { apiError } from '../utils/format';
import BrandLogo from '../components/BrandLogo';

const demoLogins = [
  ['Admin', 'admin@curecafe.test'],
  ['Doctor', 'doctor@curecafe.test'],
  ['Dietician', 'dietician@curecafe.test'],
  ['Kitchen', 'kitchen@curecafe.test'],
  ['Delivery', 'delivery@curecafe.test'],
  ['Patient', 'patient@curecafe.test']
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((state) => state.auth.accessToken);
  const [login, { isLoading, error }] = useLoginMutation();
  const [resendVerification, resendState] = useResendVerificationMutation();
  const [resendMessage, setResendMessage] = useState('');
  const [form, setForm] = useState({ email: 'admin@curecafe.test', password: 'Admin@1234' });

  if (token) return <Navigate to={location.state?.from?.pathname || '/'} replace />;

  async function submit(e) {
    e.preventDefault();
    setResendMessage('');
    try {
      const result = await login(form).unwrap();
      dispatch(setCredentials(result.data));
      navigate(location.state?.from?.pathname || '/');
    } catch {
      // RTK Query exposes the error through the mutation state for inline rendering.
    }
  }

  async function resend() {
    setResendMessage('');
    try {
      const response = await resendVerification({ email: form.email }).unwrap();
      setResendMessage(response.message || 'Verification email sent.');
    } catch {
      // RTK Query exposes the error through mutation state.
    }
  }

  const verificationRequired = error?.data?.details?.code === 'EMAIL_VERIFICATION_REQUIRED' || /verification/i.test(error?.data?.message || '');
  const devVerificationLink = error?.data?.details?.devVerificationLink || resendState.data?.data?.devVerificationLink;

  return (
    <div className="grid min-h-screen overflow-hidden bg-slate-950 lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden p-8 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,.38),transparent_34%),radial-gradient(circle_at_82%_28%,rgba(249,115,22,.26),transparent_30%),linear-gradient(135deg,#031712,#064e3b_50%,#3f2a1d)]" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-cafe-500/20 blur-3xl" />
        <div className="relative z-10 flex h-full flex-col justify-between rounded-[2.25rem] border border-white/10 bg-white/10 p-10 text-white shadow-2xl backdrop-blur-xl">
          <BrandLogo light />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-emerald-50">
              <Sparkles size={16} /> Secure clinical nutrition operations
            </div>
            <h1 className="mt-7 max-w-2xl text-6xl font-black leading-[0.95] tracking-tight">Cure Cafe</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-emerald-50/80">Role-based hospital meal operations with verified accounts, diet approvals, kitchen dashboards and delivery tracking.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {['Verified Access', 'JWT + RBAC', 'Diet Approvals', 'Meal Tracking', 'Inventory Alerts', 'Billing'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 font-bold backdrop-blur">{item}</div>)}
          </div>
        </div>
      </section>
      <section className="relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,.18),transparent_28rem),radial-gradient(circle_at_90%_90%,rgba(249,115,22,.14),transparent_22rem)]" />
        <div className="relative w-full max-w-md rounded-[2.25rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
          <div className="mb-8 lg:hidden"><BrandLogo /></div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700"><ShieldCheck /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Secure login</h2>
              <p className="text-sm text-slate-500">Verified accounts only.</p>
            </div>
          </div>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label>
              <span className="label">Email</span>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
            </label>
            <label>
              <span className="label">Password</span>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" required />
            </label>
            {error && <div className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{apiError(error)}</div>}
            {verificationRequired && form.email && (
              <button type="button" className="btn-secondary w-full" disabled={resendState.isLoading} onClick={resend}>
                <Mail size={16} /> {resendState.isLoading ? 'Sending verification...' : 'Resend verification email'}
              </button>
            )}
            {resendMessage && <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{resendMessage}</div>}
            {devVerificationLink && (
              <div className="rounded-2xl border border-emerald-200 bg-white p-3 text-xs">
                <p className="font-black text-slate-700">Development verification link:</p>
                <a className="break-all text-brand-700 underline" href={devVerificationLink}>{devVerificationLink}</a>
              </div>
            )}
            <button className="btn-primary w-full" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Login to Cure Cafe'}</button>
          </form>
          <div className="mt-6 rounded-[1.5rem] bg-emerald-50/70 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">Demo quick fill</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {demoLogins.map(([label, email]) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => setForm({ email, password: 'Admin@1234' })}
                  className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-left text-sm font-black text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
            <p className="flex items-center gap-2 font-bold text-slate-800"><HeartPulse size={16} /> New patient account?</p>
            <p className="mt-1">Create an account and verify your email before signing in.</p>
            <Link to="/register" className="btn-secondary mt-4 w-full">Create patient account</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
