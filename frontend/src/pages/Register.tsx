import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { Activity, ArrowRight, UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Patient);

  // Mandatory Patient fields
  const [patientId, setPatientId] = useState('PT-' + Math.floor(10000 + Math.random() * 90000));
  const [hospitalRegNumber, setHospitalRegNumber] = useState('HOSP-2026-' + Math.floor(100 + Math.random() * 900));
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [assignedDietician, setAssignedDietician] = useState('');
  const [wardNumber, setWardNumber] = useState('Ward 2A (General)');
  const [bedNumber, setBedNumber] = useState('Bed 5');
  const [diseaseType, setDiseaseType] = useState('General Post-Op');
  const [allergies, setAllergies] = useState('Peanuts, Shellfish');
  const [medicalRestrictions, setMedicalRestrictions] = useState('High Sodium, High Sugar');

  // Lists for dropdowns
  const [doctors, setDoctors] = useState<any[]>([]);
  const [dieticians, setDieticians] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch active doctors and dieticians for selection
    const fetchStaff = async () => {
      try {
        const docRes = await api.get('/users?role=Doctor');
        const dietRes = await api.get('/users?role=Dietician');
        setDoctors(docRes.data.data || []);
        setDieticians(dietRes.data.data || []);
        if (docRes.data.data?.length > 0) setAssignedDoctor(docRes.data.data[0]._id);
        if (dietRes.data.data?.length > 0) setAssignedDietician(dietRes.data.data[0]._id);
      } catch (err) {
        console.error('Failed to fetch hospital staff:', err);
      }
    };
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        password,
        phoneNumber,
        role,
      };

      if (role === UserRole.Patient) {
        payload.patientDetails = {
          patientId,
          hospitalRegNumber,
          assignedDoctor,
          assignedDietician,
          wardNumber,
          bedNumber,
          diseaseType,
          allergies: allergies.split(',').map((a) => a.trim()).filter(Boolean),
          medicalRestrictions: medicalRestrictions.split(',').map((m) => m.trim()).filter(Boolean),
        };
      }

      await api.post('/auth/register', payload);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-brand-600 text-white rounded-2xl shadow-xl shadow-brand-900/20 mb-4">
            <UserPlus className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Registration</h2>
          <p className="text-sm text-slate-500 mt-1">Hospital Food Management System (HFMS)</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@hfms.org"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1-800-555-0199"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition bg-white"
            >
              <option value={UserRole.Patient}>Patient (Includes dietary tracking & profiles)</option>
              <option value={UserRole.Doctor}>Doctor / Physician</option>
              <option value={UserRole.Dietician}>Dietician / Nutritional Specialist</option>
              <option value={UserRole.Pantry}>Inventory / Pantry Manager</option>
              <option value={UserRole.Delivery}>Meal Delivery Partner</option>
            </select>
          </div>

          {role === UserRole.Patient && (
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-5">
              <h4 className="font-bold text-slate-800 text-base tracking-tight border-b border-slate-200 pb-2">
                Mandatory Patient Profile Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Patient ID
                  </label>
                  <input
                    type="text"
                    required
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Hospital Registration No.
                  </label>
                  <input
                    type="text"
                    required
                    value={hospitalRegNumber}
                    onChange={(e) => setHospitalRegNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Assigned Doctor
                  </label>
                  <select
                    required
                    value={assignedDoctor}
                    onChange={(e) => setAssignedDoctor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="">Select Doctor...</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Assigned Dietician
                  </label>
                  <select
                    required
                    value={assignedDietician}
                    onChange={(e) => setAssignedDietician(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="">Select Dietician...</option>
                    {dieticians.map((diet) => (
                      <option key={diet._id} value={diet._id}>
                        {diet.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Ward Number
                  </label>
                  <input
                    type="text"
                    required
                    value={wardNumber}
                    onChange={(e) => setWardNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Bed Number
                  </label>
                  <input
                    type="text"
                    required
                    value={bedNumber}
                    onChange={(e) => setBedNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Primary Condition
                  </label>
                  <input
                    type="text"
                    value={diseaseType}
                    onChange={(e) => setDiseaseType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Allergies
                  </label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="Peanuts, Dairy"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Food Restrictions
                  </label>
                  <input
                    type="text"
                    value={medicalRestrictions}
                    onChange={(e) => setMedicalRestrictions(e.target.value)}
                    placeholder="High Sodium"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white py-3.5 rounded-2xl font-bold tracking-wide shadow-lg shadow-brand-900/25 transition duration-200 flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-extrabold hover:underline">
            Login Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
