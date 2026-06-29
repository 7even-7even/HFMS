import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../features/store';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ShieldAlert } from 'lucide-react';
import { disconnectSocket } from '../services/socket';

const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-brand-700 text-white shadow-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white text-brand-700 rounded-lg font-bold text-xl tracking-wider shadow-inner">
          HFMS
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide">Hospital Food Management System</h1>
          <p className="text-xs text-brand-200">Zero-Error Dietary Compliance Platform</p>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-brand-800 px-4 py-2 rounded-lg border border-brand-600 shadow-sm">
            <User className="w-5 h-5 text-brand-300" />
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full font-medium">
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
