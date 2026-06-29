import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { initSocket } from '../services/socket';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  QrCode,
  KeyRound,
  DollarSign,
} from 'lucide-react';
import Modal from '../components/Modal';

const DeliveryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // State data
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [orderToVerify, setOrderToVerify] = useState<any>(null);
  const [orderToFail, setOrderToFail] = useState<any>(null);

  // Verification Form State
  const [verifyMode, setVerifyMode] = useState<'QR' | 'OTP'>('OTP');
  const [otpInput, setOtpInput] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Failed Reason Form State
  const [failedReason, setFailedReason] = useState('');

  useEffect(() => {
    fetchDeliveries();

    const socket = initSocket();
    const handleOrderUpdate = () => {
      fetchDeliveries();
    };

    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/delivery/assigned');
      const active = res.data.data.filter((o: any) => o.deliveryStatus !== 'Delivered' && o.deliveryStatus !== 'Failed');
      const history = res.data.data.filter((o: any) => o.deliveryStatus === 'Delivered' || o.deliveryStatus === 'Failed');
      setActiveOrders(active);
      setHistoryOrders(history);
    } catch (err) {
      console.error('Failed to fetch assigned deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDelivery = async (orderId: string) => {
    try {
      await api.put(`/delivery/${orderId}/accept`);
      fetchDeliveries();
    } catch (err) {
      console.error('Failed to accept delivery:', err);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToVerify) return;
    setVerifyError('');

    try {
      const payload: any = {};
      if (verifyMode === 'OTP') payload.otp = otpInput;
      if (verifyMode === 'QR') payload.qrCodeData = qrInput;

      await api.post(`/delivery/${orderToVerify._id}/verify`, payload);
      setIsVerifyModalOpen(false);
      fetchDeliveries();
      alert('Bedside Meal Delivery Verified Successfully! Order marked completed.');
    } catch (err: any) {
      setVerifyError(err.response?.data?.message || 'Verification failed. Incorrect OTP or QR Data.');
    }
  };

  const handleFailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToFail || !failedReason.trim()) return;

    try {
      await api.post(`/delivery/${orderToFail._id}/fail`, { failedReason });
      setIsFailModalOpen(false);
      fetchDeliveries();
      alert('Delivery failure reported successfully. Pantry notified.');
    } catch (err) {
      console.error('Failed to report failed delivery:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-8 py-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Delivery Partner App Console</h2>
          <p className="text-sm text-slate-500 mt-1">Accept meal delivery tasks, confirm bedside handoff using QR Code or OTP, and report exceptions.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        {[
          { id: 'active', label: `Assigned Deliveries (${activeOrders.length})`, icon: Truck },
          { id: 'history', label: `Delivery History (${historyOrders.length})`, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400 font-medium">Loading delivery assignments...</div>
      ) : (
        <>
          {/* TAB: ACTIVE */}
          {activeTab === 'active' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">Active Assigned Bedside Deliveries</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{activeOrders.length} Pending Tasks</span>
              </div>
              {activeOrders.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-400 font-medium">No active delivery assignments. Great job!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-4 px-6">Order ID</th>
                        <th className="py-4 px-6">Patient Name</th>
                        <th className="py-4 px-6">Ward & Bed</th>
                        <th className="py-4 px-6">Meal Packaged</th>
                        <th className="py-4 px-6">Delivery Status</th>
                        <th className="py-4 px-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeOrders.map((o) => (
                        <tr key={o._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-6 font-bold text-brand-600">{o._id.substring(0, 8)}...</td>
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {o.patientId?.name}
                            <p className="text-xs text-slate-500 font-medium">{o.patientId?.phoneNumber}</p>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-700">Check App Details</td>
                          <td className="py-4 px-6 font-medium text-slate-700">
                            {o.mealItems.map((item: any) => `${item.mealId?.name} (x${item.quantity})`).join(', ')}
                          </td>
                          <td className="py-4 px-6 font-extrabold text-slate-800">{o.deliveryStatus}</td>
                          <td className="py-4 px-6 flex items-center gap-2">
                            {o.deliveryStatus === 'Assigned' && (
                              <button
                                onClick={() => handleAcceptDelivery(o._id)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                              >
                                Accept & Pickup
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {o.deliveryStatus === 'OutForDelivery' && (
                              <>
                                <button
                                  onClick={() => {
                                    setOrderToVerify(o);
                                    setOtpInput(o.verificationOTP); // Quick prefill for review demo!
                                    setQrInput(o.qrCodeData);
                                    setIsVerifyModalOpen(true);
                                  }}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Verify Bedside Handoff
                                </button>
                                <button
                                  onClick={() => {
                                    setOrderToFail(o);
                                    setIsFailModalOpen(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold text-xs transition"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Report Failure
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">Delivery Task History & Metrics</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{historyOrders.length} Completed Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6">Order ID</th>
                      <th className="py-4 px-6">Patient Name</th>
                      <th className="py-4 px-6">Meal Packaged</th>
                      <th className="py-4 px-6">Final Status</th>
                      <th className="py-4 px-6">Timestamp / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-bold text-brand-600">{o._id.substring(0, 8)}...</td>
                        <td className="py-4 px-6 font-bold text-slate-800">{o.patientId?.name}</td>
                        <td className="py-4 px-6 font-medium text-slate-700">
                          {o.mealItems.map((item: any) => `${item.mealId?.name}`).join(', ')}
                        </td>
                        <td className="py-4 px-6">
                          {o.deliveryStatus === 'Delivered' ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-full flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Delivered Successfully
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 font-bold text-xs rounded-full flex items-center gap-1 w-fit">
                              <XCircle className="w-3.5 h-3.5" />
                              Failed Delivery
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                          {o.deliveryStatus === 'Delivered' ? new Date(o.deliveredAt || o.updatedAt).toLocaleString() : `Reason: "${o.failedReason}"`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: VERIFY DELIVERY */}
      <Modal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} title="Verify Bedside Meal Handoff">
        {orderToVerify && (
          <form onSubmit={handleVerifySubmit} className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-lg">Patient: {orderToVerify.patientId?.name}</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">Meal: {orderToVerify.mealItems.map((m: any) => m.mealId?.name).join(', ')}</p>
            </div>

            {verifyError && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200 font-medium">
                {verifyError}
              </div>
            )}

            <div className="flex gap-4 border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => setVerifyMode('OTP')}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition ${verifyMode === 'OTP' ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                <KeyRound className="w-4 h-4" />
                6-Digit OTP Mode
              </button>
              <button
                type="button"
                onClick={() => setVerifyMode('QR')}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition ${verifyMode === 'QR' ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                <QrCode className="w-4 h-4" />
                QR Code String Scan Mode
              </button>
            </div>

            {verifyMode === 'OTP' ? (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Patient's Verification OTP (Pre-filled for demo)</label>
                <input
                  type="text"
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono font-bold text-lg tracking-widest text-center"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Simulated QR Code String (Pre-filled for demo)</label>
                <input
                  type="text"
                  required
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono text-xs text-slate-600 bg-slate-50"
                />
              </div>
            )}

            <button type="submit" className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/20 transition flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Verify Delivery & Complete Order
            </button>
          </form>
        )}
      </Modal>

      {/* MODAL: REPORT FAILED DELIVERY */}
      <Modal isOpen={isFailModalOpen} onClose={() => setIsFailModalOpen(false)} title="Report Delivery Handoff Failure">
        {orderToFail && (
          <form onSubmit={handleFailSubmit} className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-lg">Patient: {orderToFail.patientId?.name}</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">Meal: {orderToFail.mealItems.map((m: any) => m.mealId?.name).join(', ')}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Delivery Failure</label>
              <textarea
                required
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                placeholder="E.g. Patient was moved to emergency surgery, patient asleep, refused meal..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 h-28"
              ></textarea>
            </div>
            <button type="submit" className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-900/20 transition">
              Report Exception & Notify Pantry
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default DeliveryDashboard;
