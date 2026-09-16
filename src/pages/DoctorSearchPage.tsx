import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ShieldCheck,
  X,
  Stethoscope,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { DoctorProfile } from '../types';
import { DoctorCard } from '../components/common/DoctorCard';
import { EmptyState } from '../components/common/EmptyState';

export const DoctorSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedSpecialization, setSelectedSpecialization] = useState(searchParams.get('specialization') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedExperience, setSelectedExperience] = useState(searchParams.get('minExperience') || '');
  const [maxFee, setMaxFee] = useState(searchParams.get('maxFee') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [consultationType, setConsultationType] = useState(searchParams.get('consultationType') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Load specializations list
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const res = await api.get('/doctors/specializations');
        if (res.data.success) {
          setSpecializations(res.data.specializations || []);
        }
      } catch (err) {
        console.error('Failed to load specializations', err);
      }
    };
    fetchSpecializations();
  }, []);

  // Fetch doctors according to filters
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedSpecialization) params.append('specialization', selectedSpecialization);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedExperience) params.append('minExperience', selectedExperience);
      if (maxFee) params.append('maxFee', maxFee);
      if (minRating) params.append('minRating', minRating);
      if (consultationType) params.append('consultationType', consultationType);
      if (verifiedOnly) params.append('verifiedOnly', 'true');

      const res = await api.get(`/doctors?${params.toString()}`);
      if (res.data.success) {
        setDoctors(res.data.doctors || []);
      }
    } catch (err) {
      console.error('Error searching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [
    searchQuery,
    selectedSpecialization,
    selectedCity,
    selectedExperience,
    maxFee,
    minRating,
    consultationType,
    verifiedOnly
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSpecialization('');
    setSelectedCity('');
    setSelectedExperience('');
    setMaxFee('');
    setMinRating('');
    setConsultationType('');
    setVerifiedOnly(false);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Find Doctors &amp; Specialists
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified medical practitioners with active clinic consultation hours
          </p>
        </div>

        <div className="flex items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500 transition">
          <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name, specialty, clinic, or medical condition..."
            className="w-full px-3 py-2 bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-teal-600" /> Filters
              </span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Reset All
              </button>
            </div>

            {/* Verified Only Toggle */}
            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> Council Verified Only
                </span>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                Show only practitioners whose medical registration number is verified by the admin
              </p>
            </div>

            {/* Specialization Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Specialization
              </label>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">City</label>
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                placeholder="e.g. New York, Mumbai"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Minimum Experience */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Experience
              </label>
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Any Experience</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="10">10+ Years</option>
                <option value="15">15+ Years</option>
              </select>
            </div>

            {/* Max Fee */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Max Fee</span>
                {maxFee && <span className="text-teal-600 font-bold">${maxFee}</span>}
              </label>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={maxFee || '300'}
                onChange={(e) => setMaxFee(e.target.value)}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>$20</span>
                <span>$300+</span>
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Minimum Rating
              </label>
              <div className="grid grid-cols-4 gap-1">
                {['', '4.0', '4.5', '4.8'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMinRating(r)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                      minRating === r
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r ? `${r}★` : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Consultation Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Consultation Mode
              </label>
              <select
                value={consultationType}
                onChange={(e) => setConsultationType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">All Modes</option>
                <option value="in-person">In-Person Clinic Visit</option>
                <option value="online">Online Video Consultation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Showing <span className="text-teal-600">{doctors.length}</span> practitioner{doctors.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No doctors found matching your criteria."
              description="Try broadening your search term, clearing specialization filters, or adjusting the maximum consultation fee."
              actionLabel="Clear All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {doctors.map((doc) => (
                <DoctorCard key={doc._id} doctor={doc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
