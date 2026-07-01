import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, UserPlus } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useRegisterMutation } from '../services/api';
import { apiError } from '../utils/format';

export default function RegisterPage() {
  const [register, state] = useRegisterMutation();
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  async function submit(e) {
    e.preventDefault();
    try {
      const response = await register(form).unwrap();
      setResult(response);
    } catch {
      // RTK Query exposes the error through state.error for inline rendering.
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-xl rounded-[2.25rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl">
        <BrandLogo />
        {result ? (
          <div className="mt-8 rounded-[1.5rem] bg-emerald-50 p-6 text-emerald-900">
            <MailCheck size={42} />
            <h1 className="mt-4 text-2xl font-black">Verify your email</h1>
            <p className="mt-2 text-sm leading-6">{result.message}</p>
            {result.data?.devVerificationLink && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-3 text-xs">
                <p className="font-black">Development verification link:</p>
                <a className="break-all text-brand-700 underline" href={result.data.devVerificationLink}>{result.data.devVerificationLink}</a>
              </div>
            )}
            <Link to="/login" className="btn-primary mt-6">Back to login</Link>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <div className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-black text-brand-700"><UserPlus size={16} className="mr-2" /> Patient account registration</div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Create your Cure Cafe account</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">For security, your account remains inactive until you verify your email address.</p>
            </div>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <label><span className="label">Full name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label><span className="label">Email</span><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
              <label><span className="label">Phone</span><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label><span className="label">Password</span><input className="input" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
              {state.error && <div className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{apiError(state.error)}</div>}
              <button className="btn-primary w-full" disabled={state.isLoading}>{state.isLoading ? 'Creating account...' : 'Create account and send verification'}</button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-500">Already verified? <Link to="/login" className="font-bold text-brand-700">Login</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
