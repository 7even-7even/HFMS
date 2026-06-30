export default function StatCard({ title, value, subtitle, tone = 'blue', icon: Icon }) {
  const tones = {
    blue: 'bg-sky-50 text-sky-700 ring-sky-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    purple: 'bg-purple-50 text-purple-700 ring-purple-100'
  };
  return (
    <div className="card group p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          {subtitle && <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>}
        </div>
        {Icon && <div className={`rounded-2xl p-3 ring-1 transition group-hover:scale-105 ${tones[tone] || tones.blue}`}><Icon size={22} /></div>}
      </div>
    </div>
  );
}
