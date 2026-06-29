import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { initSocket } from '../services/socket';
import {
  ClipboardList,
  Package,
  FileText,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  UserCheck,
} from 'lucide-react';
import Modal from '../components/Modal';

const PantryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'reports'>('orders');

  // State data
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<any>(null);
  const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState('');

  // Update Stock Form State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editQty, setEditQty] = useState(0);

  useEffect(() => {
    fetchOrders();
    fetchInventory();
    fetchReports();
    fetchDeliveryPartners();

    const socket = initSocket();

    const handleOrderUpdate = () => {
      fetchOrders();
      fetchReports();
    };

    const handleLowStockAlert = (item: any) => {
      alert(`LOW STOCK WARNING: ${item.itemName} has fallen to ${item.quantity} ${item.unit}!`);
      fetchInventory();
    };

    socket.on('orderUpdate', handleOrderUpdate);
    socket.on('lowStockAlert', handleLowStockAlert);

    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
      socket.off('lowStockAlert', handleLowStockAlert);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      // Show orders that are not delivered yet
      const active = res.data.data.filter((o: any) => o.preparationStatus !== 'Delivered');
      setOrders(active);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventory(res.data.data);
      const low = res.data.data.filter((i: any) => i.quantity <= i.minimumThreshold);
      setLowStockAlerts(low);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/inventory/reports');
      setReports(res.data.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  const fetchDeliveryPartners = async () => {
    try {
      const res = await api.get('/users?role=Delivery');
      setDeliveryPartners(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch delivery partners:', err);
    }
  };

  const handleUpdatePrepStatus = async (orderId: string, nextStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/prep-status`, { preparationStatus: nextStatus });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update prep status:', err);
    }
  };

  const handleSaveStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await api.put(`/inventory/${editingItem._id}`, { quantity: editQty });
      setEditingItem(null);
      fetchInventory();
    } catch (err) {
      console.error('Failed to update inventory stock:', err);
    }
  };

  const handleAssignDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToAssign || !selectedDeliveryPartner) return;
    try {
      await api.put(`/orders/${orderToAssign._id}/assign-delivery`, { deliveryPartnerId: selectedDeliveryPartner });
      setIsAssignModalOpen(false);
      fetchOrders();
    } catch (err) {
      console.error('Failed to assign delivery partner:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-8 py-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pantry & Inventory Operations Manager</h2>
          <p className="text-sm text-slate-500 mt-1">Manage food preparation queues, package orders, monitor low-stock warnings, and track wastage.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        {[
          { id: 'orders', label: `Active Preparation Queue (${orders.length})`, icon: ClipboardList },
          { id: 'inventory', label: `Inventory Stock (${lowStockAlerts.length} Low Alerts)`, icon: Package },
          { id: 'reports', label: 'Preparation & Wastage Reports', icon: FileText },
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
        <div className="flex items-center justify-center h-64 text-slate-400 font-medium">Loading pantry queue...</div>
      ) : (
        <>
          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">Active Orders Requiring Preparation & Packaging</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{orders.length} Active Orders</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6">Order ID</th>
                      <th className="py-4 px-6">Patient Details</th>
                      <th className="py-4 px-6">Meal Items</th>
                      <th className="py-4 px-6">Order Type & Notes</th>
                      <th className="py-4 px-6">Dietary Approval</th>
                      <th className="py-4 px-6">Preparation Status</th>
                      <th className="py-4 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-bold text-brand-600">{o._id.substring(0, 8)}...</td>
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {o.patientId?.name}
                          <p className="text-xs text-slate-500 font-medium">{o.patientId?.phoneNumber}</p>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-700">
                          {o.mealItems.map((item: any) => `${item.mealId?.name} (x${item.quantity})`).join(', ')}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 font-bold text-xs rounded-full ${o.orderType === 'CustomRequest' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'}`}>
                            {o.orderType}
                          </span>
                          {o.customNotes && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl mt-1.5 border border-slate-200 max-w-xs">"{o.customNotes}"</p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 font-bold text-xs rounded-full ${o.dieticianApproval === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : o.dieticianApproval === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'}`}>
                            {o.dieticianApproval}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-extrabold text-slate-800">{o.preparationStatus}</td>
                        <td className="py-4 px-6 flex items-center gap-2">
                          {o.preparationStatus === 'Received' && (
                            <button
                              onClick={() => handleUpdatePrepStatus(o._id, 'Preparing')}
                              className="flex items-center gap-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                            >
                              Start Prep
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {o.preparationStatus === 'Preparing' && (
                            <button
                              onClick={() => handleUpdatePrepStatus(o._id, 'Packaged')}
                              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                            >
                              Mark Packaged
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {o.preparationStatus === 'Packaged' && (
                            <button
                              onClick={() => {
                                setOrderToAssign(o);
                                if (deliveryPartners.length > 0) setSelectedDeliveryPartner(deliveryPartners[0]._id);
                                setIsAssignModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Assign Delivery
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

          {/* TAB: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">Pantry Ingredient Stock & Threshold Alerts</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{inventory.length} Stock Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6">Item Name</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Current Stock</th>
                      <th className="py-4 px-6">Alert Threshold</th>
                      <th className="py-4 px-6">Stock Status</th>
                      <th className="py-4 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((item) => {
                      const isLow = item.quantity <= item.minimumThreshold;
                      return (
                        <tr key={item._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-6 font-bold text-slate-800">{item.itemName}</td>
                          <td className="py-4 px-6 text-slate-600 font-medium">{item.category}</td>
                          <td className="py-4 px-6 font-black text-slate-800">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-medium">
                            {item.minimumThreshold} {item.unit}
                          </td>
                          <td className="py-4 px-6">
                            {isLow ? (
                              <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 font-bold text-xs rounded-full flex items-center gap-1.5 w-fit">
                                <AlertOctagon className="w-4 h-4 text-red-600" />
                                Low Stock Alert
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-full">
                                Good Stock
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setEditQty(item.quantity);
                              }}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                            >
                              Update Quantity
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: REPORTS */}
          {activeTab === 'reports' && reports && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Orders Today</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">{reports.totalOrdersToday}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase">Currently Preparing</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">{reports.totalPrepared}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase">Packaged / Ready</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">{reports.totalPackaged}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase">Delivered Orders</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">{reports.totalDelivered}</p>
                </div>
              </div>

              {/* Wastage Statistics Box */}
              <div className="p-8 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-3xl shadow-xl border border-red-500 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-200 font-bold text-xs uppercase tracking-wider">
                    <TrendingDown className="w-4 h-4" />
                    Food Wastage & Failure Statistics
                  </div>
                  <h3 className="text-2xl font-black">Estimated Daily Food Wastage: {reports.wastageStats.wastagePercentage}%</h3>
                  <p className="text-xs text-red-100 max-w-md">Calculated based on unconsumed pantry preparations or failed bedside delivery handoffs.</p>
                </div>
                <div className="flex gap-6">
                  <div className="p-6 bg-red-900/60 rounded-2xl border border-red-500/60 text-center">
                    <p className="text-xs font-bold text-red-200 uppercase">Wasted Meals</p>
                    <p className="text-2xl font-black mt-1">{reports.wastageStats.wastedMealsCount}</p>
                  </div>
                  <div className="p-6 bg-red-900/60 rounded-2xl border border-red-500/60 text-center">
                    <p className="text-xs font-bold text-red-200 uppercase">Estimated Loss</p>
                    <p className="text-2xl font-black mt-1">${reports.wastageStats.estimatedLossAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: ASSIGN DELIVERY PARTNER */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Delivery Partner">
        <form onSubmit={handleAssignDeliverySubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Active Delivery Partner</label>
            <select
              value={selectedDeliveryPartner}
              onChange={(e) => setSelectedDeliveryPartner(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {deliveryPartners.map((dp) => (
                <option key={dp._id} value={dp._id}>
                  {dp.name} ({dp.isOnline ? 'Active Online' : 'Offline'})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/20 transition">
            Confirm Delivery Assignment
          </button>
        </form>
      </Modal>

      {/* MODAL: EDIT STOCK QUANTITY */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Update Ingredient Stock Quantity">
        {editingItem && (
          <form onSubmit={handleSaveStockUpdate} className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-lg">{editingItem.itemName}</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">Category: {editingItem.category} • Minimum Threshold: {editingItem.minimumThreshold} {editingItem.unit}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">New Stock Quantity ({editingItem.unit})</label>
              <input
                type="number"
                required
                value={editQty}
                onChange={(e) => setEditQty(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <button type="submit" className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/20 transition">
              Save Inventory Stock
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PantryDashboard;
