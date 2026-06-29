import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { initSocket } from '../services/socket';
import {
  Users,
  UserCheck,
  Stethoscope,
  Utensils,
  Truck,
  ClipboardList,
  DollarSign,
  Package,
  ShieldCheck,
  Plus,
  RefreshCw,
} from 'lucide-react';
import Modal from '../components/Modal';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'menu' | 'inventory' | 'orders' | 'logs'>('metrics');

  // State data
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // New Item states
  const [newMeal, setNewMeal] = useState({ name: '', category: 'Breakfast', calories: 250, protein: 10, carbs: 30, fat: 5, sugar: 5, sodium: 150, price: 5.0 });
  const [newInventory, setNewInventory] = useState({ itemName: '', category: 'Grains & Cereals', quantity: 20, unit: 'kg', minimumThreshold: 10 });

  useEffect(() => {
    fetchData(activeTab);

    const socket = initSocket();

    const handleUserStatusChange = () => {
      if (activeTab === 'metrics') fetchDashboardMetrics();
      if (activeTab === 'users') fetchUsers();
    };

    const handleOrderUpdate = () => {
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'metrics') fetchDashboardMetrics();
    };

    socket.on('userStatusChange', handleUserStatusChange);
    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('userStatusChange', handleUserStatusChange);
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [activeTab]);

  const fetchData = (tab: string) => {
    setLoading(true);
    if (tab === 'metrics') fetchDashboardMetrics();
    else if (tab === 'users') fetchUsers();
    else if (tab === 'menu') fetchMenu();
    else if (tab === 'inventory') fetchInventory();
    else if (tab === 'orders') fetchOrders();
    else if (tab === 'logs') fetchLogs();
  };

  const fetchDashboardMetrics = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await api.get('/meals');
      setMenuItems(res.data.data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventory(res.data.data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/analytics/audit-logs?limit=50');
      setAuditLogs(res.data.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      await api.put(`/users/${userId}`, { active: !currentActive });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/meals', newMeal);
      setIsMenuModalOpen(false);
      fetchMenu();
    } catch (err) {
      console.error('Failed to add meal:', err);
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory', newInventory);
      setIsInventoryModalOpen(false);
      fetchInventory();
    } catch (err) {
      console.error('Failed to add inventory item:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-8 py-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Administrator Management Console</h2>
          <p className="text-sm text-slate-500 mt-1">Full control over users, hospital inventory, active orders, menu catalog, and audit logs.</p>
        </div>
        <button
          onClick={() => fetchData(activeTab)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh View
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        {[
          { id: 'metrics', label: 'Dashboard Analytics', icon: DollarSign },
          { id: 'users', label: 'Hospital Staff & Patients', icon: Users },
          { id: 'menu', label: 'Menu Catalog Manager', icon: Utensils },
          { id: 'inventory', label: 'Inventory Stock Overseer', icon: Package },
          { id: 'orders', label: 'Active Orders & Payments', icon: ClipboardList },
          { id: 'logs', label: 'System Audit Logs', icon: ShieldCheck },
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
        <div className="flex items-center justify-center h-64 text-slate-400 font-medium">Loading system data...</div>
      ) : (
        <>
          {/* TAB: METRICS */}
          {activeTab === 'metrics' && metrics && (
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs uppercase font-extrabold text-slate-400">Total Patients</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{metrics.totalPatients}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs uppercase font-extrabold text-slate-400">Active Doctors</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{metrics.activeDoctors}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs uppercase font-extrabold text-slate-400">Active Dieticians</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{metrics.activeDieticians}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                  <Utensils className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs uppercase font-extrabold text-slate-400">Pantry Staff Online</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{metrics.pantryStaffOnline}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs uppercase font-extrabold text-slate-400">Delivery Partners Online</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{metrics.deliveryPartnersOnline}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                  <ClipboardList className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs uppercase font-extrabold text-slate-400">Active Food Orders</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{metrics.activeOrders}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl">
                  <Package className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs uppercase font-extrabold text-slate-400">Pending Deliveries</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{metrics.pendingDeliveries}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-brand-50 text-brand-700 rounded-2xl">
                  <DollarSign className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs uppercase font-extrabold text-slate-400">Cafeteria Revenue Today</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">${metrics.revenueToday.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">Hospital System Users & Roles</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{users.length} Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6">Full Name</th>
                      <th className="py-4 px-6">Email Address</th>
                      <th className="py-4 px-6">System Role</th>
                      <th className="py-4 px-6">Phone Number</th>
                      <th className="py-4 px-6">Online Status</th>
                      <th className="py-4 px-6">Account Status</th>
                      <th className="py-4 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-bold text-slate-800">{u.name}</td>
                        <td className="py-4 px-6 text-slate-600">{u.email}</td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-brand-50 text-brand-700 font-bold text-xs rounded-full border border-brand-200">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600">{u.phoneNumber || 'N/A'}</td>
                        <td className="py-4 px-6">
                          {u.isOnline ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active Online
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">Offline</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {u.active ? (
                            <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Active</span>
                          ) : (
                            <span className="text-red-600 font-bold text-xs bg-red-50 px-2.5 py-1 rounded-full border border-red-200">Deactivated</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleUpdateUserStatus(u._id, u.active)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                              u.active
                                ? 'bg-red-100 hover:bg-red-200 text-red-700'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                            }`}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: MENU CATALOG */}
          {activeTab === 'menu' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">Hospital Approved Food Catalog</h3>
                <button
                  onClick={() => setIsMenuModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-900/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add New Meal
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6">Meal Name</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Nutrition (Kcal / P / C / F)</th>
                      <th className="py-4 px-6">Sodium / Sugar</th>
                      <th className="py-4 px-6">Allergens</th>
                      <th className="py-4 px-6">Price</th>
                      <th className="py-4 px-6">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {menuItems.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-bold text-slate-800">{m.name}</td>
                        <td className="py-4 px-6 font-medium text-slate-600">{m.category}</td>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {m.calories} kcal / {m.protein}g / {m.carbs}g / {m.fat}g
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {m.sodium}mg / {m.sugar}g
                        </td>
                        <td className="py-4 px-6">
                          {m.allergens.length > 0 ? (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs rounded-full">
                              {m.allergens.join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">None</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">${m.price.toFixed(2)}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-full">
                            Available
                          </span>
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
                <h3 className="font-extrabold text-slate-800 text-lg">Inventory Stock & Low-Stock Alerts</h3>
                <button
                  onClick={() => setIsInventoryModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-900/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Inventory Item
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6">Item Name</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Stock Quantity</th>
                      <th className="py-4 px-6">Minimum Threshold</th>
                      <th className="py-4 px-6">Stock Status</th>
                      <th className="py-4 px-6">Last Restocked</th>
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
                                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                                Low Stock Alert
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-full">
                                Optimal Stock
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                            {new Date(item.lastRestocked).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">All Hospital Active & Past Orders</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{orders.length} Total Orders</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6">Order ID</th>
                      <th className="py-4 px-6">Patient Name</th>
                      <th className="py-4 px-6">Meals Included</th>
                      <th className="py-4 px-6">Order Type</th>
                      <th className="py-4 px-6">Prep Status</th>
                      <th className="py-4 px-6">Delivery Status</th>
                      <th className="py-4 px-6">Delivery Partner</th>
                      <th className="py-4 px-6">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-bold text-brand-600">{o._id.substring(0, 8)}...</td>
                        <td className="py-4 px-6 font-bold text-slate-800">{o.patientId?.name || 'Deleted User'}</td>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {o.mealItems.map((item: any) => `${item.mealId?.name || 'Meal'} (x${item.quantity})`).join(', ')}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 font-bold text-xs rounded-full ${o.orderType === 'CustomRequest' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'}`}>
                            {o.orderType}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700">{o.preparationStatus}</td>
                        <td className="py-4 px-6 font-bold text-slate-700">{o.deliveryStatus}</td>
                        <td className="py-4 px-6 text-slate-600">{o.deliveryPartnerId?.name || 'Unassigned'}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 font-bold text-xs rounded-full ${o.paymentStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}`}>
                            {o.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-lg">HIPAA System Audit Activity Logs</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest 50 Operations</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/60 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Action Executed</th>
                      <th className="py-4 px-6">Operator Name & Role</th>
                      <th className="py-4 px-6">IP Address</th>
                      <th className="py-4 px-6">Operational Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-brand-700">{log.action}</td>
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {log.userId?.name} <span className="text-xs text-slate-400 font-medium">({log.userId?.role})</span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-mono text-xs">{log.ipAddress || '127.0.0.1'}</td>
                        <td className="py-4 px-6 text-xs text-slate-600 bg-slate-50 font-mono rounded-xl p-3 my-2 border border-slate-100 block overflow-x-auto max-w-xs">
                          {JSON.stringify(log.details)}
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

      {/* MODAL: ADD MEAL */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title="Add New Meal to Hospital Catalog">
        <form onSubmit={handleAddMeal} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Meal Name</label>
            <input
              type="text"
              required
              value={newMeal.name}
              onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
              placeholder="E.g. Grilled Salmon & Steamed Asparagus"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newMeal.category}
                onChange={(e) => setNewMeal({ ...newMeal, category: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
                <option value="Beverage">Beverage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={newMeal.price}
                onChange={(e) => setNewMeal({ ...newMeal, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Calories (kcal)</label>
              <input
                type="number"
                value={newMeal.calories}
                onChange={(e) => setNewMeal({ ...newMeal, calories: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Protein (g)</label>
              <input
                type="number"
                value={newMeal.protein}
                onChange={(e) => setNewMeal({ ...newMeal, protein: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={newMeal.carbs}
                onChange={(e) => setNewMeal({ ...newMeal, carbs: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Fat (g)</label>
              <input
                type="number"
                value={newMeal.fat}
                onChange={(e) => setNewMeal({ ...newMeal, fat: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Sugar (g)</label>
              <input
                type="number"
                value={newMeal.sugar}
                onChange={(e) => setNewMeal({ ...newMeal, sugar: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Sodium (mg)</label>
              <input
                type="number"
                value={newMeal.sodium}
                onChange={(e) => setNewMeal({ ...newMeal, sodium: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/20 transition mt-4">
            Save Meal to Catalog
          </button>
        </form>
      </Modal>

      {/* MODAL: ADD INVENTORY */}
      <Modal isOpen={isInventoryModalOpen} onClose={() => setIsInventoryModalOpen(false)} title="Add New Inventory Item">
        <form onSubmit={handleAddInventory} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
            <input
              type="text"
              required
              value={newInventory.itemName}
              onChange={(e) => setNewInventory({ ...newInventory, itemName: e.target.value })}
              placeholder="E.g. Premium Quinoa"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                required
                value={newInventory.category}
                onChange={(e) => setNewInventory({ ...newInventory, category: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Unit (e.g., kg, liters, packets)</label>
              <input
                type="text"
                required
                value={newInventory.unit}
                onChange={(e) => setNewInventory({ ...newInventory, unit: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Initial Quantity</label>
              <input
                type="number"
                value={newInventory.quantity}
                onChange={(e) => setNewInventory({ ...newInventory, quantity: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Minimum Alert Threshold</label>
              <input
                type="number"
                value={newInventory.minimumThreshold}
                onChange={(e) => setNewInventory({ ...newInventory, minimumThreshold: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-900/20 transition mt-4">
            Save Inventory Stock
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
