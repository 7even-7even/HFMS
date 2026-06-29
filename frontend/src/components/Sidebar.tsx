import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../features/store';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Utensils,
  ClipboardList,
  Package,
  Truck,
  ShieldCheck,
  FileText,
  Stethoscope,
  ShoppingBag,
} from 'lucide-react';
import { UserRole } from '../types';

const Sidebar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  const getLinks = () => {
    switch (user.role) {
      case UserRole.Admin:
        return [
          { name: 'Dashboard Metrics', path: '/admin', icon: LayoutDashboard },
          { name: 'Manage Staff & Users', path: '/admin/users', icon: Users },
          { name: 'Menu Catalog Manager', path: '/admin/menu', icon: Utensils },
          { name: 'Inventory Overseer', path: '/admin/inventory', icon: Package },
          { name: 'All Hospital Orders', path: '/admin/orders', icon: ClipboardList },
          { name: 'System Audit Logs', path: '/admin/audit', icon: ShieldCheck },
        ];
      case UserRole.Doctor:
      case UserRole.Dietician:
        return [
          { name: 'Assigned Patients', path: '/doctor', icon: Users },
          { name: 'Diet Plan Builder', path: '/doctor/plans', icon: Stethoscope },
          { name: 'Custom Requests Queue', path: '/doctor/custom-requests', icon: ClipboardList },
          { name: 'Patient Chat & Queries', path: '/doctor/chat', icon: FileText },
        ];
      case UserRole.Patient:
        return [
          { name: 'My Diet Plan & Limits', path: '/patient', icon: LayoutDashboard },
          { name: 'Food Catalog & Order', path: '/patient/catalog', icon: ShoppingBag },
          { name: 'Track Active Orders', path: '/patient/orders', icon: Truck },
          { name: 'Chat with Doctor/Dietician', path: '/patient/chat', icon: FileText },
        ];
      case UserRole.Pantry:
        return [
          { name: 'Active Orders Queue', path: '/pantry', icon: ClipboardList },
          { name: 'Inventory & Stock Alerts', path: '/pantry/inventory', icon: Package },
          { name: 'Preparation & Wastage Reports', path: '/pantry/reports', icon: FileText },
        ];
      case UserRole.Delivery:
        return [
          { name: 'Assigned Deliveries', path: '/delivery', icon: Truck },
          { name: 'Delivery Verification', path: '/delivery/verify', icon: ShieldCheck },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-800 text-slate-300 min-h-[calc(100vh-72px)] p-4 flex flex-col shadow-lg">
      <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4 px-3">
        Navigation
      </div>
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path.split('/').length === 2}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30 font-semibold'
                    : 'hover:bg-slate-700 hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto pt-6 border-t border-slate-700 text-xs text-slate-500 px-3">
        HFMS v1.0.0 Enterprise • HIPAA Compliant
      </div>
    </aside>
  );
};

export default Sidebar;
