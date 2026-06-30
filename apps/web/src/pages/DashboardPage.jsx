import { useSelector } from 'react-redux';
import { Activity, Bell, CreditCard, Package, Sparkles, Users, Utensils } from 'lucide-react';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import BrandLogo from '../components/BrandLogo';
import { useBillingChargesQuery, useKitchenDashboardQuery, useLowStockQuery, useMealOrdersQuery, useNotificationsQuery, usePatientsQuery, useDailyMealsReportQuery } from '../services/api';
import { ROLES, can, humanize, money, timeOnly } from '../utils/format';

export default function DashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const opsRole = can(user, [ROLES.ADMIN, ROLES.DOCTOR, ROLES.DIETICIAN, ROLES.KITCHEN_STAFF, ROLES.DELIVERY_STAFF]);
  const kitchenRole = can(user, [ROLES.ADMIN, ROLES.DIETICIAN, ROLES.KITCHEN_STAFF]);
  const billingRole = can(user, [ROLES.ADMIN, ROLES.DIETICIAN, ROLES.PATIENT]);
  const { data: patients } = usePatientsQuery({ status: 'ADMITTED', limit: 10 }, { skip: !opsRole && user?.role !== ROLES.PATIENT });
  const { data: kitchen } = useKitchenDashboardQuery({}, { skip: !kitchenRole });
  const { data: lowStock } = useLowStockQuery(undefined, { skip: !kitchenRole });
  const { data: meals } = useMealOrdersQuery({ limit: 8 }, { skip: !user });
  const { data: notifications } = useNotificationsQuery({ unreadOnly: 'true', limit: 5 }, { skip: !user });
  const { data: billing } = useBillingChargesQuery({ limit: 20 }, { skip: !billingRole });
  const { data: report } = useDailyMealsReportQuery({}, { skip: !kitchenRole });

  const totalBilling = billing?.data?.items?.reduce((sum, item) => sum + item.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2.25rem] bg-slate-950 p-6 text-white shadow-2xl shadow-emerald-950/20 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(16,185,129,.42),transparent_30%),radial-gradient(circle_at_88%_20%,rgba(249,115,22,.22),transparent_28%)]" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-7"><BrandLogo light /></div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-emerald-50"><Sparkles size={16} /> Welcome back, {user?.name}</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-tight lg:text-5xl">Run hospital meal care with calm precision.</h2>
            <p className="mt-4 max-w-3xl text-emerald-50/75">Cure Cafe connects doctors, dieticians, kitchen teams, delivery staff and patients in one RBAC-secured nutrition workspace.</p>
          </div>
          <div className="grid min-w-64 grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-emerald-50/70">Today</p><p className="text-2xl font-black">{kitchen?.data?.totalMeals ?? report?.data?.report?.total ?? meals?.data?.total ?? '—'}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-emerald-50/70">Alerts</p><p className="text-2xl font-black">{lowStock?.data?.items?.length ?? '—'}</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={user?.role === ROLES.PATIENT ? 'My Profile' : 'Admitted Patients'} value={patients?.data?.total ?? '—'} subtitle="Currently in scope" icon={Users} />
        <StatCard title="Meals Today" value={kitchen?.data?.totalMeals ?? report?.data?.report?.total ?? meals?.data?.total ?? '—'} subtitle="Scheduled/served" icon={Utensils} tone="green" />
        <StatCard title="Low Stock Items" value={lowStock?.data?.items?.length ?? '—'} subtitle="Inventory alerts" icon={Package} tone="amber" />
        <StatCard title="Meal Charges" value={money(totalBilling)} subtitle="Visible billing scope" icon={CreditCard} tone="purple" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-950">Latest meal orders</h3>
            <Activity className="text-brand-600" />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Patient</th><th>Meal</th><th>Ward</th><th>Time</th><th>Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {(meals?.data?.items || []).map((order) => (
                  <tr key={order.id} className="text-slate-700"><td className="py-3 font-semibold">{order.patient?.name}</td><td>{humanize(order.mealType)}</td><td>{order.ward}</td><td>{timeOnly(order.plannedFor)}</td><td><Badge value={order.status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-950">Unread notifications</h3>
            <Bell className="text-brand-600" />
          </div>
          <div className="mt-4 space-y-3">
            {(notifications?.data?.items || []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                <p className="font-bold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
              </div>
            ))}
            {!notifications?.data?.items?.length && <p className="text-sm text-slate-500">No unread notifications.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
