import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  User as UserIcon,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      showToast('Welcome back! Login successful.');
      navigate('/');
    } else {
      showToast(res.message || 'Invalid credentials.', 'error');
    }
  };

  const handleQuick = async (role: 'admin' | 'verified_doctor' | 'pending_doctor' | 'patient') => {
    await quickLogin(role);
    showToast(`Signed in as demo ${role.replace('_', ' ')}`);
    if (role === 'admin') navigate('/admin');
    else if (role.includes('doctor')) navigate('/doctor-dashboard');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Doc<span className="text-teal-600">Pulse</span>
            </span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900">Sign in to your account</h2>
          <p className="text-xs text-slate-500">Access your appointments, medical records, or clinic dashboard</p>
        </div>

        {/* Quick Demo Login Helper Card */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md space-y-3">
          <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Instant Demo Account Access
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuick('admin')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-left transition border border-slate-700"
            >
              <span className="block text-teal-300 font-bold">Admin Console</span>
              <span className="text-[10px] text-slate-400">admin@docpulse.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuick('verified_doctor')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-left transition border border-slate-700"
            >
              <span className="block text-teal-300 font-bold">Verified Doctor</span>
              <span className="text-[10px] text-slate-400">Dr. Rahul Sharma</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuick('pending_doctor')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-amber-900/60 text-xs font-semibold text-left transition border border-amber-500/30"
            >
              <span className="block text-amber-300 font-bold">Unverified Doctor</span>
              <span className="text-[10px] text-slate-400">Dr. Ananya Roy (Pending)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuick('patient')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-left transition border border-slate-700"
            >
              <span className="block text-teal-300 font-bold">Patient Account</span>
              <span className="text-[10px] text-slate-400">Priya Patel</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 block">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<'patient' | 'doctor'>(
    searchParams.get('role') === 'doctor' ? 'doctor' : 'patient'
  );

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Prefer not to say');

  // Doctor Specific Fields
  const [specialization, setSpecialization] = useState('General Physician');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [experience, setExperience] = useState('5');
  const [consultationFee, setConsultationFee] = useState('60');
  const [medicalRegistrationNumber, setMedicalRegistrationNumber] = useState('');
  const [medicalCouncil, setMedicalCouncil] = useState('State Medical Council');
  const [about, setAbout] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'doctor' && (!medicalRegistrationNumber.trim() || !medicalCouncil.trim())) {
      showToast('Medical registration number and State Medical Council are mandatory for doctor verification.', 'error');
      return;
    }

    setLoading(true);
    const payload: any = {
      name,
      email,
      password,
      role,
      phone,
      gender
    };

    if (role === 'doctor') {
      payload.specialization = specialization;
      payload.qualification = qualification;
      payload.experience = Number(experience);
      payload.consultationFee = Number(consultationFee);
      payload.medicalRegistrationNumber = medicalRegistrationNumber.trim();
      payload.medicalCouncil = medicalCouncil.trim();
      payload.about = about;
    }

    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      showToast(
        role === 'doctor'
          ? 'Doctor account created! Verification request submitted to admin.'
          : 'Patient account registered successfully!'
      );
      if (role === 'doctor') navigate('/doctor-dashboard');
      else navigate('/dashboard');
    } else {
      showToast(res.message || 'Registration failed.', 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Doc<span className="text-teal-600">Pulse</span>
            </span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900">Create your account</h2>
          <p className="text-xs text-slate-500">Join the network as a patient or verified medical consultant</p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              role === 'patient'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" /> Patient Account
          </button>
          <button
            type="button"
            onClick={() => setRole('doctor')}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              role === 'doctor'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Medical Doctor
          </button>
        </div>

        {role === 'doctor' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-800">Verification Governance Notice</span>
              Doctor registrations start in <code className="bg-amber-100 font-bold px-1 rounded">pending</code> status. Per healthcare platform regulations, your profile and appointment slot publishing will activate once the administrator reviews your state medical credentials.
            </div>
          </div>
        )}

        {/* Registration Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {role === 'doctor' ? 'Doctor Full Name (with Dr. prefix)' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'doctor' ? 'Dr. John Doe' : 'Jane Doe'}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            {/* Doctor Specific Medical Licensing Fields */}
            {role === 'doctor' && (
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                  Medical Qualifications &amp; Licensing
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Specialization *
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Dentist">Dentist</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Gynecology">Gynecology</option>
                      <option value="General Physician">General Physician</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Degrees / Qualifications *
                    </label>
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. MBBS, MD, MS"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Medical Registration No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={medicalRegistrationNumber}
                      onChange={(e) => setMedicalRegistrationNumber(e.target.value)}
                      placeholder="e.g. MED-89421"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Medical Council / Board *
                    </label>
                    <input
                      type="text"
                      required
                      value={medicalCouncil}
                      onChange={(e) => setMedicalCouncil(e.target.value)}
                      placeholder="e.g. State Medical Council"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      min="0"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Consultation Fee ($)
                    </label>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      min="10"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition"
            >
              {loading ? 'Creating account...' : role === 'doctor' ? 'Register & Submit for Verification' : 'Create Patient Account'}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
