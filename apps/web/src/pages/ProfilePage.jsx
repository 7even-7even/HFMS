import { useSelector } from 'react-redux';
import { Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import Badge from '../components/Badge';
import { roleLabel, dateOnly, humanize } from '../utils/format';

export default function ProfilePage() {
  const user = useSelector((state) => state.auth.user);
  const patient = user?.patientProfile;
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-700"><UserRound size={32} /></div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">{user?.name}</h2>
              <p className="mt-1 text-sm font-bold text-brand-700">{roleLabel(user?.role)}</p>
            </div>
          </div>
          <Badge value={user?.isActive ? 'APPROVED' : 'CANCELLED'} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="text-lg font-black text-slate-950">Account details</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p className="flex items-center gap-2"><Mail size={16} className="text-brand-700" /> {user?.email}</p>
            <p className="flex items-center gap-2"><Phone size={16} className="text-brand-700" /> {user?.phone || 'No phone added'}</p>
            <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-700" /> Email verified</p>
          </div>
        </section>
        {patient && (
          <section className="card p-5">
            <h3 className="text-lg font-black text-slate-950">Patient profile</h3>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-3"><p className="label">MRN</p><p className="font-black">{patient.mrn}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><p className="label">Status</p><p className="font-black">{humanize(patient.status)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><p className="label">Location</p><p className="font-black">{patient.ward}, {patient.roomNumber}/{patient.bedNumber}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><p className="label">Admission</p><p className="font-black">{dateOnly(patient.admissionDate)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3 sm:col-span-2"><p className="label">Current diet</p><p className="font-black">{humanize(patient.currentDietPlan?.dietType || 'Normal')}</p></div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
