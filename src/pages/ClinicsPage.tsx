import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Search,
  Stethoscope,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { Clinic } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const ClinicsPage: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCity) params.append('city', selectedCity);

      const res = await api.get(`/clinics?${params.toString()}`);
      if (res.data.success) {
        setClinics(res.data.clinics || []);
      }
    } catch (err) {
      console.error('Failed to load clinics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [searchTerm, selectedCity]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Medical Clinics &amp; Hospitals
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore accredited outpatient facilities, verified doctor consultancies, and multi-specialty clinics
        </p>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-teal-500">
          <Search className="w-5 h-5 text-slate-400 ml-2 mr-1 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clinic by name, address, or facility..."
            className="w-full px-2 py-1.5 bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none text-sm"
          />
        </div>

        <input
          type="text"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          placeholder="Filter by city (e.g. New York, Mumbai)..."
          className="px-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Clinics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : clinics.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clinics found."
          description="No registered clinics match your current search. Doctors can register and add their clinics directly from their dashboard."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedCity('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic) => (
            <div
              key={clinic._id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md">
                      {clinic.type}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{clinic.name}</h3>
                  </div>
                  {clinic.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {clinic.description || 'Modern outpatient clinic equipped with diagnostic and therapeutic healthcare facilities.'}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {clinic.address}, {clinic.city}, {clinic.state} {clinic.pincode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {clinic.openingTime} - {clinic.closingTime} ({clinic.workingDays?.join(', ')})
                    </span>
                  </div>

                  {clinic.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{clinic.phone}</span>
                    </div>
                  )}
                </div>

                {/* Facilities Pills */}
                {clinic.facilities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {clinic.facilities.slice(0, 4).map((f) => (
                      <span
                        key={f}
                        className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                {clinic.doctor ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={clinic.doctor.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80'}
                      alt={clinic.doctor.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate text-xs">
                      <span className="font-semibold text-slate-800 block truncate">
                        {clinic.doctor.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {clinic.doctor.specialization}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">DocPulse Partner</span>
                )}

                {clinic.doctor && (
                  <Link
                    to={`/doctors/${clinic.doctor._id}#book`}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1"
                  >
                    <span>Book Slot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
