import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Building2,
  Calendar,
  Star,
  ArrowRight,
  HeartPulse,
  Activity,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { DoctorProfile } from '../types';
import { DoctorCard } from '../components/common/DoctorCard';
import { EmptyState } from '../components/common/EmptyState';

const SPECIALTIES = [
  { name: 'Cardiology', icon: '❤️', desc: 'Heart & cardiovascular care' },
  { name: 'Dermatology', icon: '✨', desc: 'Skin, hair & allergy specialists' },
  { name: 'Dentist', icon: '🦷', desc: 'Oral hygiene & dental implants' },
  { name: 'Neurology', icon: '🧠', desc: 'Brain, nerves & spine care' },
  { name: 'Orthopedics', icon: '🦴', desc: 'Joints, bones & fracture care' },
  { name: 'Pediatrics', icon: '👶', desc: 'Child wellness & vaccination' },
  { name: 'Gynecology', icon: '🌸', desc: 'Women health & prenatal care' },
  { name: 'General Physician', icon: '🩺', desc: 'Preventive & family medicine' }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        if (res.data.success) {
          setDoctors(res.data.doctors || []);
        }
      } catch (err) {
        console.error('Failed to fetch registered doctors', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopDoctors();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/find-doctors?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/find-doctors');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-white pt-12 pb-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-teal-100/70 text-teal-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-200">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Verified Medical Practitioners &amp; Accredited Clinics</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Find the right doctor for your healthcare needs
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Search by doctor name, medical specialty, registered clinic, or condition. Book direct, guaranteed appointments with zero double-booking.
            </p>

            {/* Main Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex items-center bg-white p-2 rounded-2xl shadow-xl shadow-teal-900/5 border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500 transition">
                <div className="flex items-center flex-1 px-3">
                  <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search doctor, specialty (e.g. Cardiology), or clinic..."
                    className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none text-sm sm:text-base"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition flex items-center gap-2 shrink-0"
                >
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* Quick Keyword Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500 pt-2">
              <span className="font-semibold text-slate-700">Popular:</span>
              {['Cardiology', 'Dermatology', 'Dentist', 'Orthopedics', 'Pediatrics'].map((spec) => (
                <button
                  key={spec}
                  onClick={() => navigate(`/find-doctors?specialization=${spec}`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-medium transition"
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Specializations Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Browse by Medical Specialization
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a field to connect with specialized, verified consultants
            </p>
          </div>
          <Link
            to="/find-doctors"
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 group"
          >
            <span>All Specialties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {SPECIALTIES.map((spec) => (
            <button
              key={spec.name}
              onClick={() => navigate(`/find-doctors?specialization=${spec.name}`)}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 text-left hover:border-teal-500 hover:shadow-md transition duration-200 group"
            >
              <div className="text-2xl mb-2">{spec.icon}</div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-600 transition">
                {spec.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{spec.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Registered Doctors Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Registered Doctors
              </h2>
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                All Registrations
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Every registered doctor appears here, even before verification is complete. Verification status is shown separately and only affects booking access.
            </p>
          </div>
          <Link
            to="/find-doctors"
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 group"
          >
            <span>View All ({doctors.length})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={HeartPulse}
            title="No doctors found."
            description="There are currently no verified doctors in the system. If demo data was cleared, doctors can register or the admin can re-seed."
            actionLabel="Register as Doctor"
            onAction={() => navigate('/register?role=doctor')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.slice(0, 6).map((doc) => (
              <DoctorCard key={doc._id} doctor={doc} />
            ))}
          </div>
        )}
      </section>

      {/* Features Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              A Transparent, Reliable Healthcare Platform
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Designed to solve ghost clinics and unverified practitioners. Every doctor registration requires verified state medical council licensing, multiple clinic addresses, and guaranteed synchronized appointment booking.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <ShieldCheck className="w-6 h-6 text-teal-400 mb-2" />
                <h4 className="font-bold text-sm">Strict Admin Verification</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Doctors cannot accept bookings until state credentials are formally validated.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <Building2 className="w-6 h-6 text-teal-400 mb-2" />
                <h4 className="font-bold text-sm">Multi-Clinic Support</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Doctors manage multiple independent practice locations and specific hours.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <Calendar className="w-6 h-6 text-teal-400 mb-2" />
                <h4 className="font-bold text-sm">Zero Double-Booking</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Database-level lock ensures guaranteed time slot reservations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
