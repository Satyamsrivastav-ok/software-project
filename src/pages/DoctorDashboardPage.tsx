import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Building2,
  Clock,
  FileText,
  MessageSquare,
  User,
  ShieldCheck,
  AlertCircle,
  Plus,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Trash2,
  Edit2,
  MapPin,
  ExternalLink
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Appointment, Clinic, Review } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const DoctorDashboardPage: React.FC = () => {
  const { user, doctorProfile, refreshAuth } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'appointments' | 'clinics' | 'availability' | 'prescription' | 'reviews' | 'profile'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Clinic Modal
  const [clinicModalOpen, setClinicModalOpen] = useState(false);
  const [clinicFormData, setClinicFormData] = useState({
    name: '',
    type: 'Clinic',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    openingTime: '09:00 AM',
    closingTime: '06:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    facilities: ['Pharmacy', 'Waiting Lounge', 'Diagnostic Lab'],
    emergencyAvailable: false,
    onlineConsultation: true,
    inPersonConsultation: true
  });

  // Availability Settings
  const [availabilityData, setAvailabilityData] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    slotDuration: 30,
    breakStart: '01:00 PM',
    breakEnd: '02:00 PM'
  });

  // Prescription Writer
  const [selectedAppointmentForRx, setSelectedAppointmentForRx] = useState<Appointment | null>(null);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxSymptoms, setRxSymptoms] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxAdvice, setRxAdvice] = useState('Maintain proper hydration and complete full prescribed course.');
  const [rxFollowUp, setRxFollowUp] = useState('');
  const [rxMedicines, setRxMedicines] = useState([
    { name: 'Paracetamol 500mg', dosage: '1 tablet twice daily', duration: '5 days', instructions: 'After meals' }
  ]);

  // Review Response
  const [respondingReviewId, setRespondingReviewId] = useState<string | null>(null);
  const [doctorResponseText, setDoctorResponseText] = useState('');

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const [apptsRes, clinicsRes, revRes, availRes] = await Promise.all([
        api.get('/appointments/my'),
        api.get('/clinics/my'),
        doctorProfile ? api.get(`/reviews/doctor/${doctorProfile._id}`) : Promise.resolve({ data: { reviews: [] } }),
        api.get('/availability/my')
      ]);

      if (apptsRes.data.success) setAppointments(apptsRes.data.appointments || []);
      if (clinicsRes.data.success) setClinics(clinicsRes.data.clinics || []);
      if (revRes.data.success) setReviews(revRes.data.reviews || []);
      if (availRes.data.success && availRes.data.schedules?.length > 0) {
        const s = availRes.data.schedules[0];
        setAvailabilityData({
          workingDays: s.workingDays || availabilityData.workingDays,
          startTime: s.startTime || '09:00 AM',
          endTime: s.endTime || '05:00 PM',
          slotDuration: s.slotDuration || 30,
          breakStart: s.breakTimes?.[0]?.startTime || '01:00 PM',
          breakEnd: s.breakTimes?.[0]?.endTime || '02:00 PM'
        });
      }
    } catch (err) {
      console.error('Error loading doctor workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [doctorProfile?._id]);

  const isVerified = doctorProfile?.verificationStatus === 'verified';

  // Appointment Status Change Handler
  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const res = await api.put(`/appointments/${appointmentId}/status`, { status });
      if (res.data.success) {
        showToast(`Appointment status updated to ${status}`);
        fetchDoctorData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Add Clinic Form Handler
  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/clinics', clinicFormData);
      if (res.data.success) {
        showToast('New clinic registered successfully! It is now linked to your profile.');
        setClinicModalOpen(false);
        fetchDoctorData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Delete Clinic Handler
  const handleDeleteClinic = async (clinicId: string) => {
    if (!confirm('Are you sure you want to remove this clinic?')) return;
    try {
      const res = await api.delete(`/clinics/${clinicId}`);
      if (res.data.success) {
        showToast('Clinic removed.');
        fetchDoctorData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Save Availability Handler
  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      showToast('Unverified doctors cannot publish availability slots. Awaiting admin verification.', 'error');
      return;
    }

    try {
      const res = await api.post('/availability', {
        workingDays: availabilityData.workingDays,
        startTime: availabilityData.startTime,
        endTime: availabilityData.endTime,
        slotDuration: Number(availabilityData.slotDuration),
        breakTimes: [{ startTime: availabilityData.breakStart, endTime: availabilityData.breakEnd }]
      });
      if (res.data.success) {
        showToast('Practice schedule and time slots successfully updated!');
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Issue Prescription
  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentForRx) {
      showToast('Please choose an appointment to prescribe for.', 'error');
      return;
    }
    if (!rxDiagnosis.trim()) {
      showToast('Clinical diagnosis is required.', 'error');
      return;
    }

    try {
      const res = await api.post('/prescriptions', {
        appointmentId: selectedAppointmentForRx._id,
        diagnosis: rxDiagnosis,
        symptoms: rxSymptoms,
        consultationNotes: rxNotes,
        advice: rxAdvice,
        followUpDate: rxFollowUp,
        medicines: rxMedicines
      });

      if (res.data.success) {
        showToast('Prescription issued! Consultation marked as completed.');
        setSelectedAppointmentForRx(null);
        setRxDiagnosis('');
        setRxSymptoms('');
        setRxNotes('');
        fetchDoctorData();
        setActiveTab('appointments');
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Respond to Review
  const handleSendDoctorResponse = async (reviewId: string) => {
    if (!doctorResponseText.trim()) return;
    try {
      const res = await api.post(`/reviews/${reviewId}/respond`, {
        doctorResponse: doctorResponseText
      });
      if (res.data.success) {
        showToast('Response posted to patient review.');
        setRespondingReviewId(null);
        setDoctorResponseText('');
        fetchDoctorData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Verification Banner */}
      <div className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={doctorProfile?.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80'}
              alt={doctorProfile?.name || 'Doctor'}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {doctorProfile?.name || user?.name}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Practitioner
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" /> Verification {doctorProfile?.verificationStatus}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {doctorProfile?.specialization} &bull; Reg: {doctorProfile?.medicalRegistrationNumber} ({doctorProfile?.medicalCouncil})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setClinicModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Clinic
            </button>
          </div>
        </div>

        {/* Dynamic Verification Alert Banner */}
        {isVerified ? (
          <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold block text-teal-800">Verified Doctor Status Active</span>
              Your medical registration credentials and clinic affiliations are certified by platform administration. You can publish calendar slots and receive verified patient bookings.
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold block text-amber-800">
                Pending Administrator Verification ({doctorProfile?.verificationStatus})
              </span>
              Your medical council registration number (<span className="font-mono font-bold">{doctorProfile?.medicalRegistrationNumber}</span>) is awaiting administrative review. Under healthcare platform regulations, slot publication and appointment acceptance are locked until verification is approved.
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'appointments'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('clinics')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'clinics'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> My Clinics ({clinics.length})
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'availability'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" /> Availability &amp; Slots
        </button>
        <button
          onClick={() => setActiveTab('prescription')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'prescription'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Issue Prescription
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'reviews'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Patient Reviews ({reviews.length})
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming appointments."
              description={
                isVerified
                  ? "You don't have any booked patient consultations. Once patients book slots at your registered clinics, they will appear here."
                  : 'Account awaiting verification. Patients cannot book slots until verification is completed by the administrator.'
              }
            />
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-base">
                        Patient: {apt.patientName}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : apt.status === 'completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : apt.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {apt.status}
                      </span>
                      <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold">
                        {apt.consultationType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {apt.date} &bull; {apt.startTime} - {apt.endTime}
                      </span>
                      <span>Clinic: {apt.clinic?.name || 'Clinic'}</span>
                      {apt.patientPhone && <span>Phone: {apt.patientPhone}</span>}
                    </div>

                    <p className="text-xs text-slate-500 italic mt-1">
                      Chief Complaint: {apt.reason}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          setSelectedAppointmentForRx(apt);
                          setActiveTab('prescription');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" /> Start &amp; Prescribe
                      </button>
                    )}

                    {apt.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
                      >
                        Confirm Slot
                      </button>
                    )}

                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button
                        onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        Cancel
                      </button>
                    )}

                    {apt.prescriptionId && (
                      <Link
                        to={`/prescriptions/${apt.prescriptionId}`}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200"
                      >
                        View Prescription
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY CLINICS (Multi-Clinic creation) */}
      {activeTab === 'clinics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Registered Clinics &amp; Hospitals
              </h2>
              <p className="text-xs text-slate-500">
                Add and manage multiple independent practice locations, opening hours, and facilities
              </p>
            </div>
            <button
              onClick={() => setClinicModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Clinic
            </button>
          </div>

          {clinics.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No clinics registered yet."
              description="Doctors can practice across multiple locations. Add your first clinic or hospital to enable patient bookings."
              actionLabel="Add My Clinic"
              onAction={() => setClinicModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clinics.map((clinic) => (
                <div
                  key={clinic._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {clinic.type}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{clinic.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {clinic.address}, {clinic.city} - {clinic.pincode}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteClinic(clinic._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Clinic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {clinic.openingTime} - {clinic.closingTime}
                    </span>
                    <span className={clinic.isActive ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {clinic.isActive ? '● Active' : 'Inactive'}
                    </span>
                  </div>

                  {clinic.facilities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {clinic.facilities.map((f) => (
                        <span key={f} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AVAILABILITY & SLOTS */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Consultation Schedule &amp; Slot Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure your daily working hours, slot durations, and break intervals. The booking engine automatically computes real-time availability.
            </p>
          </div>

          <form onSubmit={handleSaveAvailability} className="space-y-6">
            {/* Working Days */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const selected = availabilityData.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setAvailabilityData((prev) => ({
                          ...prev,
                          workingDays: selected
                            ? prev.workingDays.filter((d) => d !== day)
                            : [...prev.workingDays, day]
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        selected
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Practice Start Time
                </label>
                <input
                  type="text"
                  value={availabilityData.startTime}
                  onChange={(e) => setAvailabilityData({ ...availabilityData, startTime: e.target.value })}
                  placeholder="09:00 AM"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Practice End Time
                </label>
                <input
                  type="text"
                  value={availabilityData.endTime}
                  onChange={(e) => setAvailabilityData({ ...availabilityData, endTime: e.target.value })}
                  placeholder="05:00 PM"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Slot Duration (Minutes)
                </label>
                <select
                  value={availabilityData.slotDuration}
                  onChange={(e) => setAvailabilityData({ ...availabilityData, slotDuration: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            {/* Break Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Lunch / Break Start
                </label>
                <input
                  type="text"
                  value={availabilityData.breakStart}
                  onChange={(e) => setAvailabilityData({ ...availabilityData, breakStart: e.target.value })}
                  placeholder="01:00 PM"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Lunch / Break End
                </label>
                <input
                  type="text"
                  value={availabilityData.breakEnd}
                  onChange={(e) => setAvailabilityData({ ...availabilityData, breakEnd: e.target.value })}
                  placeholder="02:00 PM"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isVerified}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs shadow-sm transition"
            >
              Save Schedule Settings
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ISSUE PRESCRIPTION */}
      {activeTab === 'prescription' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" /> Digital Prescription Generator
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Issue clinical diagnosis, medication schedule, and follow-up directives to complete an appointment
            </p>
          </div>

          <form onSubmit={handleIssuePrescription} className="space-y-5">
            {/* Appointment Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Select Patient Appointment *
              </label>
              <select
                value={selectedAppointmentForRx?._id || ''}
                onChange={(e) => {
                  const apt = appointments.find((a) => a._id === e.target.value);
                  setSelectedAppointmentForRx(apt || null);
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="">-- Choose active appointment --</option>
                {appointments
                  .filter((a) => ['confirmed', 'pending'].includes(a.status))
                  .map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.patientName} &bull; {a.date} ({a.startTime}) - {a.reason}
                    </option>
                  ))}
              </select>
            </div>

            {/* Diagnosis & Symptoms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Bronchitis, Essential Hypertension"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Presenting Symptoms
                </label>
                <input
                  type="text"
                  value={rxSymptoms}
                  onChange={(e) => setRxSymptoms(e.target.value)}
                  placeholder="e.g. Dry cough, low-grade fever 3 days"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {/* Consultation Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Clinical Observations &amp; Exam Notes
              </label>
              <textarea
                rows={2}
                value={rxNotes}
                onChange={(e) => setRxNotes(e.target.value)}
                placeholder="Vitals: BP 120/80, Pulse 76. Chest clear on auscultation."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 resize-none"
              />
            </div>

            {/* Medicines List */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 block">
                  Prescribed Medications (Rx)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setRxMedicines([
                      ...rxMedicines,
                      { name: '', dosage: '', duration: '', instructions: '' }
                    ])
                  }
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug
                </button>
              </div>

              {rxMedicines.map((med, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                      value={med.name}
                      onChange={(e) => {
                        const copy = [...rxMedicines];
                        copy[idx].name = e.target.value;
                        setRxMedicines(copy);
                      }}
                      className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 1 cap 3 times daily)"
                      value={med.dosage}
                      onChange={(e) => {
                        const copy = [...rxMedicines];
                        copy[idx].dosage = e.target.value;
                        setRxMedicines(copy);
                      }}
                      className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 5 days)"
                      value={med.duration}
                      onChange={(e) => {
                        const copy = [...rxMedicines];
                        copy[idx].duration = e.target.value;
                        setRxMedicines(copy);
                      }}
                      className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Instructions (e.g. After food)"
                      value={med.instructions}
                      onChange={(e) => {
                        const copy = [...rxMedicines];
                        copy[idx].instructions = e.target.value;
                        setRxMedicines(copy);
                      }}
                      className="text-xs p-2 rounded-lg border border-slate-200 bg-white sm:col-span-2"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Advice & Follow Up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">General Advice</label>
                <input
                  type="text"
                  value={rxAdvice}
                  onChange={(e) => setRxAdvice(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Follow Up Date</label>
                <input
                  type="date"
                  value={rxFollowUp}
                  onChange={(e) => setRxFollowUp(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedAppointmentForRx}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white font-semibold text-xs shadow-md transition"
            >
              Sign &amp; Issue Prescription
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: PATIENT REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No patient reviews yet."
              description="Patients who complete consultations with you can submit verified reviews and ratings."
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{rev.patientName}</span>
                    <span className="text-xs font-bold text-amber-500">★ {rev.rating}/5</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>

                  {rev.doctorResponse ? (
                    <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100 text-xs text-teal-900">
                      <span className="font-bold block text-teal-800">Your Response:</span>
                      <p>{rev.doctorResponse}</p>
                    </div>
                  ) : (
                    <div>
                      {respondingReviewId === rev._id ? (
                        <div className="space-y-2 pt-2">
                          <textarea
                            rows={2}
                            value={doctorResponseText}
                            onChange={(e) => setDoctorResponseText(e.target.value)}
                            placeholder="Write professional response to patient..."
                            className="w-full text-xs p-2 rounded-xl border border-slate-200"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setRespondingReviewId(null)}
                              className="px-3 py-1 text-xs text-slate-500"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSendDoctorResponse(rev._id)}
                              className="px-3 py-1 text-xs bg-teal-600 text-white rounded-lg font-semibold"
                            >
                              Post Response
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setRespondingReviewId(rev._id);
                            setDoctorResponseText('');
                          }}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                        >
                          Reply to Patient
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Clinic Modal */}
      {clinicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Add New Clinic or Hospital</h3>
              <p className="text-xs text-slate-500">
                Register an independent practice location with consultation timings
              </p>
            </div>

            <form onSubmit={handleAddClinic} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={clinicFormData.name}
                  onChange={(e) => setClinicFormData({ ...clinicFormData, name: e.target.value })}
                  placeholder="e.g. CareWell Poly Clinic"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Facility Type</label>
                  <select
                    value={clinicFormData.type}
                    onChange={(e) => setClinicFormData({ ...clinicFormData, type: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="Clinic">Outpatient Clinic</option>
                    <option value="Hospital">Private Hospital</option>
                    <option value="Poly Clinic">Poly Clinic</option>
                    <option value="Diagnostic Center">Diagnostic Center</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">City *</label>
                  <input
                    type="text"
                    required
                    value={clinicFormData.city}
                    onChange={(e) => setClinicFormData({ ...clinicFormData, city: e.target.value })}
                    placeholder="e.g. New York"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Street Address *</label>
                <input
                  type="text"
                  required
                  value={clinicFormData.address}
                  onChange={(e) => setClinicFormData({ ...clinicFormData, address: e.target.value })}
                  placeholder="Suite 400, Medical Arts Tower"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">State</label>
                  <input
                    type="text"
                    value={clinicFormData.state}
                    onChange={(e) => setClinicFormData({ ...clinicFormData, state: e.target.value })}
                    placeholder="NY"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Postal Pincode</label>
                  <input
                    type="text"
                    value={clinicFormData.pincode}
                    onChange={(e) => setClinicFormData({ ...clinicFormData, pincode: e.target.value })}
                    placeholder="10001"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Opening Time</label>
                  <input
                    type="text"
                    value={clinicFormData.openingTime}
                    onChange={(e) => setClinicFormData({ ...clinicFormData, openingTime: e.target.value })}
                    placeholder="09:00 AM"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Closing Time</label>
                  <input
                    type="text"
                    value={clinicFormData.closingTime}
                    onChange={(e) => setClinicFormData({ ...clinicFormData, closingTime: e.target.value })}
                    placeholder="06:00 PM"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Phone</label>
                <input
                  type="text"
                  value={clinicFormData.phone}
                  onChange={(e) => setClinicFormData({ ...clinicFormData, phone: e.target.value })}
                  placeholder="+1 (555) 234-5678"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClinicModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm"
                >
                  Register Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
