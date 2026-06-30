import { useSelector } from 'react-redux';
import { Bell, CreditCard, HeartPulse, PackageCheck, Star, Users, Utensils, WalletCards } from 'lucide-react';
import StatCard from '../components/StatCard';
import BrandLogo from '../components/BrandLogo';
import { useDashboardSummaryQuery } from '../services/api';
import { ROLES, humanize, money, roleLabel } from '../utils/format';

function Hero({ user }) {
  return (
    <div className="relative overflow-hidden rounded-[2.25rem] bg-slate-950 p-6 text-white shadow-2xl shadow-emerald-950/20 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(16,185,129,.42),transparent_30%),radial-gradient(circle_at_88%_20%,rgba(249,115,22,.22),transparent_28%)]" />
      <div className="relative z-10">
        <BrandLogo light />
        <p className="mt-7 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-emerald-50">{roleLabel(user?.role)} Workspace</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight lg:text-5xl">Welcome back, {user?.name}</h2>
        <p className="mt-4 max-w-3xl text-emerald-50/75">Cure Cafe keeps hospital nutrition, orders, care communication and billing aligned by role.</p>
      </div>
    </div>
  );
}

function ProfileCard({ summary }) {
  const patient = summary?.patient;
  return (
    <section className="card p-5">
      <h3 className="text-lg font-black text-slate-950">Summarized profile</h3>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3"><p className="label">Name</p><p className="font-black">{summary?.profile?.name}</p></div>
        <div className="rounded-2xl bg-slate-50 p-3"><p className="label">Role</p><p className="font-black">{roleLabel(summary?.role)}</p></div>
        {patient && <><div className="rounded-2xl bg-slate-50 p-3"><p className="label">Ward</p><p className="font-black">{patient.ward}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="label">Bed</p><p className="font-black">{patient.roomNumber}/{patient.bedNumber}</p></div></>}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const { data } = useDashboardSummaryQuery();
  const summary = data?.data || {};

  let cards = [];
  if (user?.role === ROLES.ADMIN) {
    cards = [
      ['Patients', summary.admittedPatients || 0, Users],
      ['Doctors', summary.roleCounts?.DOCTOR || 0, HeartPulse],
      ['Dieticians', summary.roleCounts?.DIETICIAN || 0, Utensils],
      ['Kitchen Staff', summary.roleCounts?.KITCHEN_STAFF || 0, PackageCheck],
      ['Delivery Staff', summary.roleCounts?.DELIVERY_STAFF || 0, PackageCheck],
      ['Unread Notifications', summary.unreadNotifications || 0, Bell]
    ];
  } else if (user?.role === ROLES.DELIVERY_STAFF) {
    cards = [
      ['Orders Completed', summary.completedOrders || 0, PackageCheck],
      ['Orders Cancelled', summary.cancelledOrders || 0, PackageCheck],
      ['Average Rating', Number(summary.avgRating || 0).toFixed(1), Star],
      ['Cash Collected', money(summary.cashCollected || 0), WalletCards],
      ['Online Collected', money(summary.onlineCollected || 0), CreditCard],
      ['Unread Notifications', summary.unreadNotifications || 0, Bell]
    ];
  } else if (user?.role === ROLES.KITCHEN_STAFF) {
    cards = [
      ['Food Rating', Number(summary.avgFoodRating || 0).toFixed(1), Star],
      ['Total Orders', summary.totalOrders || 0, Utensils],
      ['Cancelled Orders', summary.cancelledOrders || 0, PackageCheck],
      ['Revenue', money(summary.revenue || 0), CreditCard],
      ['Unread Notifications', summary.unreadNotifications || 0, Bell]
    ];
  } else if (user?.role === ROLES.PATIENT) {
    cards = [
      ['Total Orders', summary.orderCount || 0, Utensils],
      ['Pending Bills', money(summary.pendingBillsAmount || 0), CreditCard],
      ['Diet Plan', humanize(summary.currentDietPlan?.dietType || 'Normal'), HeartPulse],
      ['Assigned Doctor', summary.assignedDoctor?.name || 'Not assigned', Users],
      ['Unread Notifications', summary.unreadNotifications || 0, Bell]
    ];
  } else {
    cards = [
      ['Admitted Patients', summary.admittedPatients || 0, Users],
      ['Open Queries', summary.openQueries || 0, MessageIcon],
      ['Unread Notifications', summary.unreadNotifications || 0, Bell]
    ];
  }

  return (
    <div className="space-y-6">
      <Hero user={user} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([title, value, Icon], index) => <StatCard key={title} title={title} value={value} icon={Icon} tone={['green','amber','purple','blue','rose'][index % 5]} />)}
      </div>
      <ProfileCard summary={summary} />
      {summary.patients?.length > 0 && (
        <section className="card p-5">
          <h3 className="text-lg font-black text-slate-950">Admitted patient list</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summary.patients.map((patient) => <div key={patient.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-black text-slate-950">{patient.name}</p><p className="text-xs text-slate-500">{patient.ward} · {patient.roomNumber}/{patient.bedNumber}</p><p className="mt-1 text-xs font-bold text-brand-700">{humanize(patient.currentDietPlan?.dietType || 'NORMAL')}</p></div>)}
          </div>
        </section>
      )}
      {summary.latestFeedback?.length > 0 && (
        <section className="card p-5">
          <h3 className="text-lg font-black text-slate-950">Latest ratings and messages</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {summary.latestFeedback.map((item) => (
              <div key={item.orderNumber} className="rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-2"><p className="font-black text-slate-950">Order {item.orderNumber}</p><p className="font-black text-amber-600">★ {Number(item.rating || 0).toFixed(1)}</p></div>
                <p className="mt-2 text-slate-600">{item.message || 'No written message'}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">{item.foodWarm !== undefined ? `Food warm: ${item.foodWarm ? 'Yes' : 'No'}` : ''} {item.staffPolite !== undefined ? `Staff polite: ${item.staffPolite ? 'Yes' : 'No'}` : ''}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MessageIcon(props) {
  return <Bell {...props} />;
}
