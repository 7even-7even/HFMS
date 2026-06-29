import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { initSocket } from '../services/socket';
import {
  Users,
  Stethoscope,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import Modal from '../components/Modal';
import ChatBox from '../components/ChatBox';

const DoctorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'patients' | 'plans' | 'custom-requests' | 'chat'>('patients');

  // State data
  const [patients, setPatients] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);

  // New Diet Plan Form State
  const [planForm, setPlanForm] = useState({
    calories: 1800,
    proteinLimit: 80,
    carbsLimit: 220,
    fatLimit: 50,
    sugarLimit: 25,
    sodiumLimit: 1500,
    allergies: '',
    foodRestrictions: '',
  });

  useEffect(() => {
    fetchAssignedPatients();
    fetchCustomRequests();

    const socket = initSocket();
    const handleOrderUpdate = () => {
      fetchCustomRequests();
      if (selectedPatient) fetchCompliance(selectedPatient.userId._id);
    };

    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, []);

  const fetchAssignedPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/assigned-patients');
      setPatients(res.data.data);
      if (res.data.data?.length > 0) {
        setSelectedPatient(res.data.data[0]);
        fetchDietPlan(res.data.data[0].userId._id);
      }
    } catch (err) {
      console.error('Failed to fetch assigned patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRequests = async () => {
    try {
      const res = await api.get('/orders?orderType=CustomRequest');
      // Filter for Pending approval
      const pending = res.data.data.filter((o: any) => o.dieticianApproval === 'Pending');
      setCustomRequests(pending);
    } catch (err) {
      console.error('Failed to fetch custom requests:', err);
    }
  };

  const fetchDietPlan = async (patientUserId: string) => {
    try {
      const res = await api.get(`/diet-plans/patient/${patientUserId}`);
      setDietPlan(res.data.data);
      setPlanForm({
        calories: res.data.data.calories,
        proteinLimit: res.data.data.proteinLimit,
        carbsLimit: res.data.data.carbsLimit,
        fatLimit: res.data.data.fatLimit,
        sugarLimit: res.data.data.sugarLimit,
        sodiumLimit: res.data.data.sodiumLimit,
        allergies: res.data.data.allergies.join(', '),
        foodRestrictions: res.data.data.foodRestrictions.join(', '),
      });
    } catch (err) {
      setDietPlan(null);
    }
  };

  const fetchCompliance = async (patientUserId: string) => {
    try {
      const res = await api.get(`/diet-plans/patient/${patientUserId}/compliance`);
      setComplianceData(res.data.data);
      setIsComplianceModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch compliance:', err);
      alert('No active orders or diet plan found today to compute compliance.');
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    fetchDietPlan(patient.userId._id);
  };

  const handleSaveDietPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const payload = {
      patientId: selectedPatient.userId._id,
      calories: planForm.calories,
      proteinLimit: planForm.proteinLimit,
      carbsLimit: planForm.carbsLimit,
      fatLimit: planForm.fatLimit,
      sugarLimit: planForm.sugarLimit,
      sodiumLimit: planForm.sodiumLimit,
      allergies: planForm.allergies.split(',').map((a) => a.trim()).filter(Boolean),
      foodRestrictions: planForm.foodRestrictions.split(',').map((f) => f.trim()).filter(Boolean),
    };

    try {
      if (dietPlan) {
        await api.put(`/diet-plans/${dietPlan._id}`, payload);
      } else {
        await api.post('/diet-plans', payload);
      }
      setIsPlanModalOpen(false);
      fetchDietPlan(selectedPatient.userId._id);
    } catch (err) {
      console.error('Failed to save diet plan:', err);
    }
  };

  const handleApproveCustomRequest = async (orderId: string, approval: 'Approved' | 'Rejected') => {
    try {
      await api.put(`/orders/${orderId}/custom-request`, { dieticianApproval: approval });
      fetchCustomRequests();
    } catch (err) {
      console.error('Failed to approve/reject custom request:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-8 py-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Doctor & Dietician Clinical Portal</h2>
          <p className="text-sm text-slate-500 mt-1">Prescribe strict dietary plans, review customized food requests, and track patient nutritional compliance.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        {[
          { id: 'patients', label: 'Assigned Patients', icon: Users },
          { id: 'plans', label: 'Diet Plan Manager', icon: Stethoscope },
          { id: 'custom-requests', label: `Custom Requests Queue (${customRequests.length})`, icon: ClipboardList },
          { id: 'chat', label: 'Patient Chat & Queries', icon: MessageSquare },
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
        <div className="flex items-center justify-center h-64 text-slate-400 font-medium">Loading clinical records...</div>
      ) : (
        <>
          {/* TAB: PATIENTS */}
          {activeTab === 'patients' && (
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column: Patient List */}
              <div className="col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-4">Assigned Patients List</h3>
                <div className="space-y-3">
                  {patients.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleSelectPatient(p)}
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                        selectedPatient?._id === p._id
                          ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-sm'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-800">{p.userId?.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{p.wardNumber} • {p.bedNumber}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Selected Patient Details */}
              <div className="col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
                {selectedPatient ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                      <div>
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                          {selectedPatient.patientId}
                        </span>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{selectedPatient.userId?.name}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Condition: {selectedPatient.diseaseType}</p>
                      </div>
                      <button
                        onClick={() => fetchCompliance(selectedPatient.userId._id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 transition"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Check Nutritional Compliance
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                        <h4 className="font-extrabold text-slate-800 text-sm tracking-tight border-b border-slate-200 pb-2">
                          Hospital Placement
                        </h4>
                        <p className="text-sm text-slate-600"><strong className="text-slate-700">Hospital Reg:</strong> {selectedPatient.hospitalRegNumber}</p>
                        <p className="text-sm text-slate-600"><strong className="text-slate-700">Ward & Bed:</strong> {selectedPatient.wardNumber} - {selectedPatient.bedNumber}</p>
                        <p className="text-sm text-slate-600"><strong className="text-slate-700">Recovery Stage:</strong> {selectedPatient.recoveryStage}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                        <h4 className="font-extrabold text-slate-800 text-sm tracking-tight border-b border-slate-200 pb-2">
                          Allergies & Restrictions
                        </h4>
                        <p className="text-sm text-slate-600"><strong className="text-slate-700">Allergies:</strong> {selectedPatient.allergies?.join(', ') || 'None'}</p>
                        <p className="text-sm text-slate-600"><strong className="text-slate-700">Medical Limits:</strong> {selectedPatient.medicalRestrictions?.join(', ') || 'None'}</p>
                      </div>
                    </div>

                    {/* Active Diet Plan Overview */}
                    <div className="p-6 bg-brand-50 rounded-3xl border border-brand-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-brand-900 text-base">Prescribed Diet Plan Parameters</h4>
                        <button
                          onClick={() => setIsPlanModalOpen(true)}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          Modify Diet Plan
                        </button>
                      </div>
                      {dietPlan ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase">Daily Calories</span>
                            <p className="text-xl font-black text-slate-800 mt-1">{dietPlan.calories} kcal</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase">Protein Limit</span>
                            <p className="text-xl font-black text-slate-800 mt-1">{dietPlan.proteinLimit}g</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase">Sodium Limit</span>
                            <p className="text-xl font-black text-slate-800 mt-1">{dietPlan.sodiumLimit}mg</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 font-medium">No diet plan prescribed yet. Click Modify to create one.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400 font-medium">Select a patient from the list to begin</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: PLANS */}
          {activeTab === 'plans' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">Diet Plan Creation & Modification Console</h3>
                  <p className="text-sm text-slate-500 mt-1">Select a patient below to instantly review or adjust their prescribed nutritional constraints.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Target Patient</label>
                  <select
                    value={selectedPatient?._id || ''}
                    onChange={(e) => handleSelectPatient(patients.find((p) => p._id === e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">Select Patient...</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.userId?.name} ({p.patientId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPatient && (
                <form onSubmit={handleSaveDietPlan} className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Max Daily Calories (kcal)</label>
                      <input
                        type="number"
                        value={planForm.calories}
                        onChange={(e) => setPlanForm({ ...planForm, calories: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Protein Intake Target (g)</label>
                      <input
                        type="number"
                        value={planForm.proteinLimit}
                        onChange={(e) => setPlanForm({ ...planForm, proteinLimit: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Carbs Limit (g)</label>
                      <input
                        type="number"
                        value={planForm.carbsLimit}
                        onChange={(e) => setPlanForm({ ...planForm, carbsLimit: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Fat Limits (g)</label>
                      <input
                        type="number"
                        value={planForm.fatLimit}
                        onChange={(e) => setPlanForm({ ...planForm, fatLimit: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Sugar Limits (g)</label>
                      <input
                        type="number"
                        value={planForm.sugarLimit}
                        onChange={(e) => setPlanForm({ ...planForm, sugarLimit: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Sodium Restrictions (mg)</label>
                      <input
                        type="number"
                        value={planForm.sodiumLimit}
                        onChange={(e) => setPlanForm({ ...planForm, sodiumLimit: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Allergies (Comma separated)</label>
                      <input
                        type="text"
                        value={planForm.allergies}
                        onChange={(e) => setPlanForm({ ...planForm, allergies: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Food Restrictions (Comma separated)</label>
                      <input
                        type="text"
                        value={planForm.foodRestrictions}
                        onChange={(e) => setPlanForm({ ...planForm, foodRestrictions: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <button type="submit" className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/20 transition">
                    Prescribe & Save Diet Plan
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB: CUSTOM REQUESTS */}
          {activeTab === 'custom-requests' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">Customized Food Requests Pending Dietician Approval</h3>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{customRequests.length} Requires Review</span>
              </div>
              {customRequests.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-400 font-medium">No pending custom food requests to review.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-4 px-6">Order ID</th>
                        <th className="py-4 px-6">Patient Name</th>
                        <th className="py-4 px-6">Requested Meal</th>
                        <th className="py-4 px-6">Custom Notes / Request</th>
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-6 font-bold text-brand-600">{req._id.substring(0, 8)}...</td>
                          <td className="py-4 px-6 font-bold text-slate-800">{req.patientId?.name}</td>
                          <td className="py-4 px-6 font-medium text-slate-700">
                            {req.mealItems.map((item: any) => item.mealId?.name).join(', ')}
                          </td>
                          <td className="py-4 px-6">
                            <span className="p-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-medium block max-w-xs">
                              "{req.customNotes}"
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                            {new Date(req.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="py-4 px-6 flex items-center gap-2">
                            <button
                              onClick={() => handleApproveCustomRequest(req._id, 'Approved')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveCustomRequest(req._id, 'Rejected')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-4">Select Patient to Chat</h3>
                <div className="space-y-3">
                  {patients.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleSelectPatient(p)}
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                        selectedPatient?._id === p._id
                          ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-sm'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-800">{p.userId?.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Patient ID: {p.patientId}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                {selectedPatient ? (
                  <ChatBox
                    targetUserId={selectedPatient.userId._id}
                    targetUserName={selectedPatient.userId.name}
                    targetUserRole="Patient"
                  />
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center h-[500px] text-slate-400 font-medium">
                    Select a patient from the left to start messaging
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: MODIFY DIET PLAN */}
      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="Modify Patient Diet Plan">
        <form onSubmit={handleSaveDietPlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Max Daily Calories (kcal)</label>
              <input
                type="number"
                value={planForm.calories}
                onChange={(e) => setPlanForm({ ...planForm, calories: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Protein Target (g)</label>
              <input
                type="number"
                value={planForm.proteinLimit}
                onChange={(e) => setPlanForm({ ...planForm, proteinLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Carbs Limit (g)</label>
              <input
                type="number"
                value={planForm.carbsLimit}
                onChange={(e) => setPlanForm({ ...planForm, carbsLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Fat Limit (g)</label>
              <input
                type="number"
                value={planForm.fatLimit}
                onChange={(e) => setPlanForm({ ...planForm, fatLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Sugar Limit (g)</label>
              <input
                type="number"
                value={planForm.sugarLimit}
                onChange={(e) => setPlanForm({ ...planForm, sugarLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Sodium Restriction (mg)</label>
              <input
                type="number"
                value={planForm.sodiumLimit}
                onChange={(e) => setPlanForm({ ...planForm, sodiumLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/20 transition mt-4">
            Update Prescribed Diet Plan
          </button>
        </form>
      </Modal>

      {/* MODAL: COMPLIANCE */}
      <Modal isOpen={isComplianceModalOpen} onClose={() => setIsComplianceModalOpen(false)} title="Patient Nutritional Compliance Report">
        {complianceData && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border flex items-center gap-4 ${complianceData.isCompliant ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              <div className={`p-4 rounded-2xl ${complianceData.isCompliant ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                {complianceData.isCompliant ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <div>
                <h4 className="text-lg font-extrabold">{complianceData.isCompliant ? 'Patient is 100% Compliant with Prescribed Diet' : 'Patient Exceeded Prescribed Nutritional Limits Today'}</h4>
                <p className="text-sm mt-1 opacity-90">{complianceData.isCompliant ? 'All delivered meals match calorie, sugar, and sodium thresholds.' : 'Delivered meals have surpassed doctor-mandated daily limits.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-base border-b border-slate-200 pb-2">Prescribed Plan Limits</h4>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Daily Calories:</strong> {complianceData.dietPlanLimits.calories} kcal</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Protein Target:</strong> {complianceData.dietPlanLimits.protein}g</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Carbs Limit:</strong> {complianceData.dietPlanLimits.carbs}g</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Fat Limit:</strong> {complianceData.dietPlanLimits.fat}g</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Sugar Limit:</strong> {complianceData.dietPlanLimits.sugar}g</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Sodium Limit:</strong> {complianceData.dietPlanLimits.sodium}mg</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-base border-b border-slate-200 pb-2">Actual Delivered Intake Today</h4>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Calories Consumed:</strong> {complianceData.actualIntakeToday.calories} kcal</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Protein Consumed:</strong> {complianceData.actualIntakeToday.protein}g</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Carbs Consumed:</strong> {complianceData.actualIntakeToday.carbs}g</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Fat Consumed:</strong> {complianceData.actualIntakeToday.fat}g</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Sugar Consumed:</strong> {complianceData.actualIntakeToday.sugar}g</p>
                <p className="text-sm font-medium text-slate-600"><strong className="text-slate-700">Sodium Consumed:</strong> {complianceData.actualIntakeToday.sodium}mg</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
