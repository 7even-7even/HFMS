import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Bike, ChefHat, CreditCard, PackageCheck, Star, XCircle } from 'lucide-react';
import Badge from '../components/Badge';
import DataState from '../components/DataState';
import NutrientPie from '../components/NutrientPie';
import OrderTracker from '../components/OrderTracker';
import { useCancelFoodOrderMutation, useFoodOrdersQuery, useSubmitFoodOrderFeedbackMutation, useUpdateFoodOrderStatusMutation } from '../services/api';
import { ROLES, humanize, money } from '../utils/format';

const statuses = ['', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const cancellable = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'];

function nextActions(order, role) {
  if (role === ROLES.KITCHEN_STAFF) {
    if (order.status === 'PLACED') return [{ status: 'ACCEPTED', label: 'Accept order', icon: ChefHat }];
    if (order.status === 'ACCEPTED') return [{ status: 'PREPARING', label: 'Start preparing', icon: ChefHat }];
    if (order.status === 'PREPARING') return [{ status: 'READY_FOR_PICKUP', label: 'Mark ready', icon: PackageCheck }];
  }
  if (role === ROLES.DELIVERY_STAFF) {
    if (order.status === 'READY_FOR_PICKUP') return [{ status: 'OUT_FOR_DELIVERY', label: 'Pick up / dispatch', icon: Bike }];
    if (order.status === 'OUT_FOR_DELIVERY') return [{ status: 'DELIVERED', label: 'Delivered + payment received', icon: CreditCard, paymentReceived: true }];
  }
  return [];
}

function StarRating({ value, onChange }) {
  return <div className="flex gap-1">{[1,2,3,4,5].map((n) => <button key={n} type="button" onClick={() => onChange(n)}><Star className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} size={24} /></button>)}</div>;
}

export default function OrdersPage() {
  const user = useSelector((state) => state.auth.user);
  const [status, setStatus] = useState('');
  const [paymentMethods, setPaymentMethods] = useState({});
  const [feedback, setFeedback] = useState({});
  const { data, isLoading, error } = useFoodOrdersQuery({ status: status || undefined, limit: 100 });
  const [updateStatus, updateState] = useUpdateFoodOrderStatusMutation();
  const [cancelOrder] = useCancelFoodOrderMutation();
  const [submitFeedback, feedbackState] = useSubmitFoodOrderFeedbackMutation();
  const orders = data?.data?.items || [];

  async function perform(order, action) {
    await updateStatus({ id: order.id, status: action.status, paymentReceived: Boolean(action.paymentReceived), paymentMethod: paymentMethods[order.id] || 'CASH', note: `Updated from Orders page to ${action.status}` });
  }

  async function sendFeedback(order) {
    const f = feedback[order.id] || { foodRating: 5, deliveryRating: 5, foodWarm: true, deliveredSafely: true, staffPolite: true, feedbackMessage: '' };
    await submitFeedback({ id: order.id, ...f });
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-emerald-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,.35),transparent_28%),radial-gradient(circle_at_85%_30%,rgba(249,115,22,.18),transparent_26%)]" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-100/80">Live order tracking</p><h2 className="mt-2 text-3xl font-black tracking-tight">Cure Cafe Orders</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">Patients track orders, kitchen prepares them, and delivery completes payment-confirmed delivery.</p></div>
          <label className="min-w-56"><span className="label text-emerald-50/70">Status filter</span><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((s) => <option key={s} value={s}>{s ? humanize(s) : 'All visible orders'}</option>)}</select></label>
        </div>
      </div>

      {updateState.error && <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">Could not update order. Please check status, payment method and permissions.</div>}

      <DataState isLoading={isLoading} error={error}>
        <section className="space-y-4">
          {orders.map((order) => {
            const actions = nextActions(order, user.role);
            const f = feedback[order.id] || { foodRating: 5, deliveryRating: 5, foodWarm: true, deliveredSafely: true, staffPolite: true, feedbackMessage: '' };
            return (
              <div key={order.id} className="card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black text-slate-950">Order {order.orderNumber}</h3><Badge value={order.status} /></div><p className="mt-1 text-sm text-slate-500">{order.patient?.name} · {order.ward}, Room {order.roomNumber}, Bed {order.bedNumber} · {new Date(order.createdAt).toLocaleString()}</p><p className="mt-2 text-sm text-slate-600">{order.specialInstructions || 'No special instructions'}</p></div>
                  <div className="rounded-2xl bg-cafe-50 px-4 py-3 text-right"><p className="text-xs font-black uppercase tracking-wide text-cafe-700">Amount</p><p className="text-2xl font-black text-cafe-900">{money(order.totalAmount)}</p><p className="text-xs text-cafe-700">Billing: {humanize(order.billingCharge?.status || 'PENDING')}</p>{order.paymentMethod && <p className="text-xs text-cafe-700">Paid via {humanize(order.paymentMethod)}</p>}</div>
                </div>
                <div className="mt-5"><OrderTracker status={order.status} /></div>
                <div className="mt-5 grid gap-3 lg:grid-cols-2">{order.items.map((line) => <div key={line.id} className="rounded-[1.25rem] border border-slate-100 bg-white p-4"><p className="font-black text-slate-950">{line.nameSnapshot}</p><p className="text-xs text-slate-500">{humanize(line.itemTypeSnapshot)} · Qty {line.quantity} · {money(line.lineTotal)}</p>{line.customizationNotes && <p className="mt-2 rounded-xl bg-brand-50 p-2 text-xs font-bold text-brand-700">Custom: {line.customizationNotes}</p>}<div className="mt-3"><NutrientPie compact item={line} /></div></div>)}</div>

                {order.status === 'OUT_FOR_DELIVERY' && user.role === ROLES.DELIVERY_STAFF && <label className="mt-5 block max-w-xs"><span className="label">Payment method</span><select className="input" value={paymentMethods[order.id] || 'CASH'} onChange={(e) => setPaymentMethods({ ...paymentMethods, [order.id]: e.target.value })}><option value="CASH">Cash</option><option value="ONLINE">Online</option></select></label>}

                <div className="mt-5 flex flex-wrap gap-2">
                  {actions.map((action) => { const Icon = action.icon; return <button key={action.status} className="btn-primary" disabled={updateState.isLoading} onClick={() => perform(order, action)}><Icon size={16} /> {action.label}</button>; })}
                  {user.role === ROLES.PATIENT && cancellable.includes(order.status) && <button className="btn-danger" onClick={() => cancelOrder({ id: order.id, reason: 'Cancelled by patient' })}><XCircle size={16} /> Cancel order · ₹20 charge</button>}
                </div>

                {user.role === ROLES.PATIENT && order.status === 'DELIVERED' && !order.feedbackSubmittedAt && <div className="mt-5 rounded-[1.25rem] bg-emerald-50 p-4"><h4 className="font-black text-emerald-950">Share feedback for this order</h4><div className="mt-4 grid gap-4 md:grid-cols-2"><label><span className="label">Food Rating</span><StarRating value={f.foodRating} onChange={(v) => setFeedback({ ...feedback, [order.id]: { ...f, foodRating: v } })} /></label><label><span className="label">Delivery Rating</span><StarRating value={f.deliveryRating} onChange={(v) => setFeedback({ ...feedback, [order.id]: { ...f, deliveryRating: v } })} /></label></div><div className="mt-4 grid gap-3 md:grid-cols-3">{[['foodWarm','Was the food warm?'],['deliveredSafely','Was it delivered safely?'],['staffPolite','Was the staff polite?']].map(([key,label]) => <label key={key} className="rounded-2xl bg-white p-3 text-sm font-bold"><input type="checkbox" className="mr-2" checked={f[key]} onChange={(e) => setFeedback({ ...feedback, [order.id]: { ...f, [key]: e.target.checked } })} />{label}</label>)}</div><textarea className="input mt-4 min-h-20" placeholder="Feedback message" value={f.feedbackMessage} onChange={(e) => setFeedback({ ...feedback, [order.id]: { ...f, feedbackMessage: e.target.value } })} /><button className="btn-primary mt-4" disabled={feedbackState.isLoading} onClick={() => sendFeedback(order)}>Submit feedback</button></div>}
                {order.feedbackSubmittedAt && <p className="mt-5 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">Feedback submitted · Food {order.foodRating}/5 · Delivery {order.deliveryRating}/5</p>}
              </div>
            );
          })}
          {!orders.length && <div className="card p-8 text-center text-sm text-slate-500">No orders found for this filter.</div>}
        </section>
      </DataState>
    </div>
  );
}
