export default function BrandLogo({ compact = false, light = false }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.svg" alt="Cure Cafe logo" className="h-12 w-12 rounded-2xl shadow-lg shadow-emerald-900/10" />
      {!compact && (
        <div>
          <p className={`text-xl font-black tracking-tight ${light ? 'text-white' : 'text-slate-950'}`}>Cure Cafe</p>
          <p className={`text-xs font-semibold ${light ? 'text-emerald-50/80' : 'text-slate-500'}`}>Clinical meals, warmly managed</p>
        </div>
      )}
    </div>
  );
}
