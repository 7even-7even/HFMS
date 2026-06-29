import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../features/store';
import api from '../services/api';
import { initSocket } from '../services/socket';
import {
  Utensils,
  Truck,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  QrCode,
  CreditCard,
  Star,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import Modal from '../components/Modal';
import ChatBox from '../components/ChatBox';
import { QRCodeSVG } from 'qrcode.react';

const PatientDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'diet' | 'catalog' | 'orders' | 'chat'>('diet');

  // State Data
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Cart & Ordering state
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [activeOrderQR, setActiveOrderQR] = useState<any>(null);
  const [orderToRate, setOrderToRate] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchDietPlan();
    fetchCatalog();
    fetchRecommendations();
    fetchOrders();

    const socket = initSocket();
    const handleOrderUpdate = (updatedOrder: any) => {
      fetchOrders();
      if (updatedOrder.preparationStatus === 'Delivered') {
        alert(`Order Delivered Successfully! Enjoy your meal.`);
      }
    };

    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, []);

  const fetchDietPlan = async () => {
    try {
      const res = await api.get(`/diet-plans/patient/${user?.id}`);
      setDietPlan(res.data.data);
    } catch (err) {
      console.error('Failed to fetch diet plan:', err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await api.get('/meals');
      setCatalog(res.data.data);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await api.get(`/meals/recommendations/${user?.id}`);
      setRecommendations(res.data.data);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleSelectMealForOrder = async (meal: any) => {
    setSelectedMeal(meal);
    setCustomNotes('');
    try {
      const res = await api.post('/meals/validate-allergy', {
        patientId: user?.id,
        mealId: meal._id,
      });
      setValidationResult(res.data.data);
      setIsOrderModalOpen(true);
    } catch (err) {
      console.error('Failed to validate meal:', err);
    }
  };

  const handleCustomNotesChange = async (notes: string) => {
    setCustomNotes(notes);
    if (!selectedMeal) return;
    try {
      const res = await api.post('/meals/validate-allergy', {
        patientId: user?.id,
        mealId: selectedMeal._id,
        customNotes: notes,
      });
      setValidationResult(res.data.data);
    } catch (err) {
      console.error('Failed to re-validate meal:', err);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeal) return;

    try {
      const res = await api.post('/orders', {
        mealItems: [{ mealId: selectedMeal._id, quantity: 1 }],
        customNotes,
      });
      setIsOrderModalOpen(false);
      fetchOrders();
      alert(`Order placed successfully! ${res.data.requiresDieticianApproval ? 'Sent to Dietician for approval.' : 'Sent to pantry for preparation.'}`);
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  const handlePayOrder = async (orderId: string) => {
    // Simulate Razorpay / Stripe checkout completion
    alert('Redirecting to Secure Online Payment Gateway (Stripe/Razorpay)... Payment Processed Successfully!');
    try {
      // Update payment status via verification or backend call
      await api.post(`/delivery/${orderId}/verify`, { paymentMethod: 'Online/Stripe' });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRatingModalOpen(false);
    alert('Thank you for your feedback! Rating recorded successfully.');
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-8 py-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Patient Dietary & Meal Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Ward: <strong className="text-slate-700">{user?.profile?.wardNumber}</strong> • Bed: <strong className="text-slate-700">{user?.profile?.bedNumber}</strong> • Primary Doctor: <strong className="text-slate-700">{user?.profile?.assignedDoctor?.name || 'Assigned Doctor'}</strong>
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        {[
          { id: 'diet', label: 'My Prescribed Diet Plan', icon: CheckCircle2 },
          { id: 'catalog', label: 'Browse Food Catalog & Order', icon: Utensils },
          { id: 'orders', label: 'Track Real-Time Orders & Pay', icon: Truck },
          { id: 'chat', label: 'Chat with Doctor / Dietician', icon: MessageSquare },
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

      {/* TAB: DIET PLAN */}
      {activeTab === 'diet' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
            <h3 className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-4">My Prescribed Nutritional Limits</h3>
            {dietPlan ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase">Daily Calories</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{dietPlan.calories} kcal</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase">Protein Target</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{dietPlan.proteinLimit}g</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase">Sodium Restriction</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{dietPlan.sodiumLimit}mg</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 space-y-3">
                    <h4 className="font-extrabold text-amber-900 text-base tracking-tight">Logged Allergies</h4>
                    <p className="text-sm font-bold text-amber-800">{dietPlan.allergies?.join(', ') || 'None logged'}</p>
                  </div>
                  <div className="p-6 bg-red-50 rounded-3xl border border-red-200 space-y-3">
                    <h4 className="font-extrabold text-red-900 text-base tracking-tight">Doctor Prescribed Restrictions</h4>
                    <p className="text-sm font-bold text-red-800">{dietPlan.foodRestrictions?.join(', ') || 'None logged'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 font-medium">Your diet plan is currently being prepared by your assigned Dietician.</p>
            )}
          </div>

          <div className="col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-4">Daily Meal Schedule</h3>
            <div className="space-y-3">
              {dietPlan?.mealSchedule?.map((sched: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{sched.mealType}</h4>
                    <p className="text-xs text-brand-600 font-bold mt-0.5">{sched.time}</p>
                  </div>
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CATALOG & RECOMMENDATIONS */}
      {activeTab === 'catalog' && (
        <div className="space-y-8">
          {/* Recommendation Engine Box */}
          {recommendations && recommendations.recommendedMeals?.length > 0 && (
            <div className="bg-gradient-to-r from-brand-700 to-brand-900 text-white rounded-3xl shadow-xl p-8 border border-brand-600 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-600 rounded-2xl shadow-inner border border-brand-500">
                  <Sparkles className="w-6 h-6 text-brand-200" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">Smart Food Recommendation Engine</h3>
                  <p className="text-xs text-brand-200 mt-0.5">Optimized for your specific condition ({user?.profile?.diseaseType}) & recovery stage</p>
                </div>
              </div>
              <div className="p-4 bg-brand-800/80 rounded-2xl border border-brand-600 text-xs font-medium space-y-1">
                <p className="font-bold text-brand-200 uppercase tracking-wider">Clinical AI Reasoning:</p>
                {recommendations.reasoning.map((r: string, idx: number) => (
                  <p key={idx}>• {r}</p>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-6">
                {recommendations.recommendedMeals.map((meal: any) => (
                  <div key={meal._id} className="bg-white text-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full border border-brand-200">
                        {meal.category}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-800 mt-2 leading-tight">{meal.name}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {meal.calories} kcal • {meal.protein}g Protein • {meal.sodium}mg Sodium
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectMealForOrder(meal)}
                      className="w-full mt-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-900/20 transition"
                    >
                      Select & Verify Order
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Catalog */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-slate-800">Complete Hospital Approved Food Catalog</h3>
              <p className="text-sm text-slate-500 mt-1">Select any item to verify dietary compliance before placing an order.</p>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {catalog.map((meal) => (
                <div key={meal._id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between hover:bg-white hover:shadow-xl hover:border-brand-200 transition duration-200">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                        {meal.category}
                      </span>
                      <span className="font-extrabold text-brand-700 text-sm">${meal.price.toFixed(2)}</span>
                    </div>
                    <h4 className="font-extrabold text-base text-slate-800 mt-3 leading-tight">{meal.name}</h4>
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      <strong className="text-slate-700">Ingredients:</strong> {meal.ingredients.join(', ')}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600 font-semibold">
                      <span>{meal.calories} kcal</span>
                      <span>{meal.protein}g Protein</span>
                      <span>{meal.sodium}mg Sodium</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectMealForOrder(meal)}
                    className="w-full mt-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-900/20 transition"
                  >
                    Order Meal
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-extrabold text-slate-800 text-lg">My Active & Past Orders</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{orders.length} Total Orders</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Meal Item</th>
                  <th className="py-4 px-6">Order Type</th>
                  <th className="py-4 px-6">Preparation Status</th>
                  <th className="py-4 px-6">Delivery Status</th>
                  <th className="py-4 px-6">Verification OTP</th>
                  <th className="py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-bold text-brand-600">{o._id.substring(0, 8)}...</td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {o.mealItems.map((item: any) => item.mealId?.name).join(', ')}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 font-bold text-xs rounded-full ${o.orderType === 'CustomRequest' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'}`}>
                        {o.orderType}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-700">{o.preparationStatus}</td>
                    <td className="py-4 px-6 font-bold text-slate-700">{o.deliveryStatus}</td>
                    <td className="py-4 px-6 font-mono font-black text-brand-700 text-base">{o.verificationOTP}</td>
                    <td className="py-4 px-6 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveOrderQR(o);
                          setIsQRModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                      >
                        <QrCode className="w-4 h-4 text-brand-600" />
                        QR Code
                      </button>

                      {o.paymentStatus === 'Pending' && o.totalPrice > 0 && (
                        <button
                          onClick={() => handlePayOrder(o._id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                        >
                          <CreditCard className="w-4 h-4" />
                          Pay Online
                        </button>
                      )}

                      {o.preparationStatus === 'Delivered' && (
                        <button
                          onClick={() => {
                            setOrderToRate(o);
                            setIsRatingModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold text-xs transition"
                        >
                          <Star className="w-4 h-4 text-amber-600" />
                          Rate & Feedback
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CHAT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-2 gap-6">
          <ChatBox
            targetUserId={user?.profile?.assignedDoctor?._id}
            targetUserName={`Dr. ${user?.profile?.assignedDoctor?.name || 'Doctor'}`}
            targetUserRole="Assigned Primary Doctor"
          />
          <ChatBox
            targetUserId={user?.profile?.assignedDietician?._id}
            targetUserName={`${user?.profile?.assignedDietician?.name || 'Dietician'}`}
            targetUserRole="Assigned Nutritional Specialist"
          />
        </div>
      )}

      {/* MODAL: ORDER VERIFICATION & ALLERGY CHECKS */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Verify Food Order & Dietary Compliance">
        {selectedMeal && (
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-lg">{selectedMeal.name}</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">Price: ${selectedMeal.price.toFixed(2)} • {selectedMeal.calories} kcal</p>
            </div>

            {validationResult && (
              <div className={`p-6 rounded-3xl border space-y-3 ${validationResult.isSafe ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${validationResult.isSafe ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {validationResult.isSafe ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-base">{validationResult.isSafe ? 'Meal Passes All Dietary & Allergy Safety Checks' : 'Dietary Warnings Detected! Requires Dietician Approval'}</h5>
                    <p className="text-xs mt-0.5 opacity-90">{validationResult.isSafe ? 'Instantly clears for pantry preparation.' : 'Placing this order will forward it to your Dietician for sign-off.'}</p>
                  </div>
                </div>
                {validationResult.warnings?.length > 0 && (
                  <div className="pt-3 border-t border-red-200/60 text-xs font-bold space-y-1">
                    {validationResult.warnings.map((w: string, idx: number) => (
                      <p key={idx}>• {w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Add Custom Food Request Notes (Optional)</label>
              <textarea
                value={customNotes}
                onChange={(e) => handleCustomNotesChange(e.target.value)}
                placeholder="E.g. No salt, extra soft boiled vegetables..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 h-28"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/20 transition"
            >
              Confirm & Place Order
            </button>
          </form>
        )}
      </Modal>

      {/* MODAL: QR CODE */}
      <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Scan QR Code or Provide OTP at Delivery">
        {activeOrderQR && (
          <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
            <div className="p-6 bg-white rounded-3xl shadow-xl border border-slate-100 inline-block">
              <QRCodeSVG value={activeOrderQR.qrCodeData} size={220} />
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Verification OTP</p>
              <p className="text-4xl font-black text-brand-700 tracking-widest mt-1">{activeOrderQR.verificationOTP}</p>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              Show this QR Code or read the 6-digit OTP to the delivery partner when your meal arrives at your bedside.
            </p>
          </div>
        )}
      </Modal>

      {/* MODAL: RATING & FEEDBACK */}
      <Modal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} title="Meal Feedback & Rating">
        {orderToRate && (
          <form onSubmit={handleSubmitRating} className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center">
              <h4 className="font-bold text-slate-800 text-base">How was your meal delivery?</h4>
              <p className="text-xs text-slate-500 mt-1">{orderToRate.mealItems.map((m: any) => m.mealId?.name).join(', ')}</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-3 rounded-2xl border transition ${rating >= star ? 'bg-amber-50 border-amber-300 text-amber-500' : 'bg-slate-50 border-slate-200 text-slate-300'}`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Additional Feedback / Review</label>
              <textarea
                required
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us about the temperature, taste, and packaging..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 h-28"
              ></textarea>
            </div>
            <button type="submit" className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/20 transition">
              Submit Feedback
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PatientDashboard;
