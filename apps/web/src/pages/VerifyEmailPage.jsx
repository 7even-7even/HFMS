import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useVerifyEmailMutation } from '../services/api';
import { apiError } from '../utils/format';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [verifyEmail, { data, error, isLoading, isSuccess }] = useVerifyEmailMutation();

  useEffect(() => {
    if (token) verifyEmail({ token });
  }, [token, verifyEmail]);

  const missingToken = !token;

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-lg rounded-[2.25rem] border border-white/70 bg-white/90 p-8 text-center shadow-2xl shadow-emerald-950/10 backdrop-blur-xl">
        <div className="flex justify-center"><BrandLogo compact /></div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">Email verification</h1>
        <div className="mt-8 rounded-[1.5rem] bg-slate-50 p-6">
          {isLoading && (
            <div className="text-slate-600">
              <Loader2 className="mx-auto animate-spin text-brand-700" size={44} />
              <p className="mt-4 font-bold">Verifying your account...</p>
            </div>
          )}
          {isSuccess && (
            <div className="text-emerald-800">
              <CheckCircle2 className="mx-auto" size={48} />
              <p className="mt-4 text-lg font-black">{data?.message || 'Email verified successfully.'}</p>
              <Link to="/login" className="btn-primary mt-6">Go to login</Link>
            </div>
          )}
          {(error || missingToken) && !isLoading && (
            <div className="text-rose-700">
              <XCircle className="mx-auto" size={48} />
              <p className="mt-4 font-black">Verification failed</p>
              <p className="mt-2 text-sm">{missingToken ? 'Verification token is missing.' : apiError(error)}</p>
              <Link to="/login" className="btn-secondary mt-6">Back to login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
