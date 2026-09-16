import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Globe
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DoctorProfile, Clinic, Slot, Review } from '../types';
import { VerifiedBadge } from '../components/common/VerifiedBadge';

export const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // tomorrow
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [consultationType, setConsultationType] = useState<'In-Person' | 'Online Video'>('In-Person');
  const [reason, setReason] = useState('');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch Doctor Details
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/doctors/${id}`);
        if (res.data.success && res.data.doctor) {
          const doctorData = res.data.doctor;
          const clinicData = doctorData.clinics || [];
          setDoctor(doctorData);
          setClinics(clinicData);
          if (clinicData.length > 0) {
            setSelectedClinicId(clinicData[0]._id);
          } else {
            setSelectedClinicId('');
          }
        } else {
          setDoctor(null);
          setClinics([]);
        }
      } catch (err) {
        console.error('Failed to load doctor profile:', err);
        setDoctor(null);
        setClinics([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/doctor/${id}`);
        if (res.data.success) {
          setReviews(res.data.reviews || []);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      }
    };

    if (id) {
      fetchDoctor();
      fetchReviews();
    }
  }, [id]);

  // Fetch Slots whenever selected date, clinic, or doctor changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!doctor || doctor.verificationStatus !== 'verified') return;
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const url = `/availability/doctor/${doctor._id}?date=${selectedDate}${
          selectedClinicId ? `&clinicId=${selectedClinicId}` : ''
        }`;
        const res = await api.get(url);
        if (res.data.success) {
          setSlots(res.data.slots || []);
        }
      } catch (err: any) {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    if (doctor && selectedDate) {
      fetchSlots();
    }
  }, [doctor, selectedDate, selectedClinicId]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast('Please log in as a patient to book an appointment.', 'error');
      navigate('/login');
      return;
    }

    if (user?.role !== 'patient') {
      showToast(`Logged in as ${user?.role}. Only patient accounts can book doctor appointments.`, 'error');
      return;
    }

    if (!selectedSlot) {
      showToast('Please select a time slot.', 'error');
      return;
    }

    if (!reason.trim()) {
      showToast('Please enter a reason or symptoms for the consultation.', 'error');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/appointments', {
        doctorId: doctor?._id,
        clinicId: selectedClinicId || clinics[0]?._id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        consultationType,
        reason,
        patientPhone
      });

      if (res.data.success) {
        showToast('Appointment successfully confirmed!', 'success');
        setBookingSuccess(true);
        // Refresh slots to mark slot as booked
        setSlots((prev) =>
          prev.map((s) =>
            s.startTime === selectedSlot.startTime ? { ...s, isAvailable: false } : s
          )
        );
        setSelectedSlot(null);
      }
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Loading doctor profile and clinic schedule...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Doctor Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          The requested doctor profile does not exist or has been removed.
        </p>
        <Link
          to="/find-doctors"
          className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
        >
          Back to Doctor Search
        </Link>
      </div>
    );
  }

  const isVerified = doctor.verificationStatus === 'verified';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner if unverified */}
      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold block">
              Professional Status: {doctor.verificationStatus.toUpperCase()}
            </span>
            This doctor is currently undergoing credential review by the platform administrator. Per medical platform governance rules, appointment scheduling is disabled until medical council verification is completed.
          </div>
        </div>
      )}

      {/* Doctor Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative shrink-0">
            <img
              src={doctor.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'}
              alt={doctor.name}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border border-slate-100 shadow-md"
              referrerPolicy="no-referrer"
            />
            {doctor.rating > 0 && (
              <div className="absolute -bottom-2 -right-1 bg-white text-slate-800 text-xs font-bold px-2 py-1 rounded-xl shadow-sm border border-slate-200 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{doctor.rating}</span>
                <span className="text-slate-400 font-normal">({doctor.reviewCount} reviews)</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                {doctor.specialization}
              </span>
              <VerifiedBadge status={doctor.verificationStatus} size="md" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {doctor.name}
            </h1>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{doctor.qualification}</span>
              <span>&bull;</span>
              <span>{doctor.experience} Years Clinical Experience</span>
              <span>&bull;</span>
              <span className="text-slate-500">Gender: {doctor.gender}</span>
            </div>

            {/* Medical Registration & Council Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 flex flex-wrap items-center gap-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Medical Registration No.
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {doctor.medicalRegistrationNumber}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Medical Council / Board
                </span>
                <span className="font-medium text-slate-800">{doctor.medicalCouncil}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Consultation Fee
                </span>
                <span className="text-sm font-bold text-teal-700">${doctor.consultationFee}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Profile Details & Booking Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Bio, Clinics, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Doctor */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" /> Professional Background
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {doctor.about || 'Senior clinical consultant specializing in evidence-based medical diagnostics and patient-centered treatment plans.'}
            </p>

            {doctor.languages?.length > 0 && (
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700">Languages:</span>
                <span>{doctor.languages.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Registered Clinics */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" /> Practice Clinics &amp; Hospitals
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {clinics.length} Location{clinics.length === 1 ? '' : 's'}
              </span>
            </div>

            {clinics.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No clinics registered yet.</p>
            ) : (
              <div className="space-y-4">
                {clinics.map((clinic) => (
                  <div
                    key={clinic._id}
                    className={`p-4 rounded-xl border transition ${
                      selectedClinicId === clinic._id
                        ? 'border-teal-500 bg-teal-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{clinic.name}</h3>
                          {clinic.isVerified && (
                            <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold">
                              Verified Clinic
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {clinic.address}, {clinic.city}, {clinic.state} - {clinic.pincode}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedClinicId(clinic._id);
                          document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                          selectedClinicId === clinic._id
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {selectedClinicId === clinic._id ? 'Selected' : 'Select'}
                      </button>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {clinic.openingTime} - {clinic.closingTime}
                        </span>
                      </div>

                      {clinic.facilities?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {clinic.facilities.slice(0, 3).map((f) => (
                            <span
                              key={f}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Reviews */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" /> Verified Patient Reviews
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {reviews.length} total review{reviews.length === 1 ? '' : 's'}
              </span>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No reviews yet. Only patients who have completed an appointment with this doctor can submit verified reviews.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div key={rev._id} className="py-4 space-y-2 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{rev.patientName}</span>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{rev.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>

                    {rev.doctorResponse && (
                      <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-xs text-teal-900 mt-2 space-y-1">
                        <span className="font-bold block text-teal-800">Doctor Response:</span>
                        <p>{rev.doctorResponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Appointment Booking Engine */}
        <div className="lg:col-span-1" id="booking-section">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm sticky top-20 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" /> Book Consultation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant confirmation with zero double-booking
              </p>
            </div>

            {!isVerified ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Booking Unavailable</h4>
                <p className="text-xs text-slate-500">
                  This doctor's account is {doctor.verificationStatus}. Medical platform rules prohibit unverified doctors from accepting patient appointments.
                </p>
              </div>
            ) : bookingSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-emerald-900 text-base">Appointment Booked!</h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your appointment with {doctor.name} on {selectedDate} at {selectedSlot?.startTime || 'selected time'} is confirmed.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/dashboard"
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition"
                  >
                    View in My Appointments
                  </Link>
                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    Book Another Slot
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                {/* Clinic Selector */}
                {clinics.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Select Clinic Location
                    </label>
                    <select
                      value={selectedClinicId}
                      onChange={(e) => setSelectedClinicId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                    >
                      {clinics.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Consultation Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                  />
                </div>

                {/* Available Time Slots */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Available Time Slots
                    </label>
                    {slotsLoading && (
                      <span className="text-[10px] text-teal-600 animate-pulse">
                        Checking calendar...
                      </span>
                    )}
                  </div>

                  {slotsLoading ? (
                    <div className="grid grid-cols-3 gap-2 py-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      No available slots on this date. Doctor may be off-duty or on scheduled break.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {slots.map((slot) => (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                            !slot.isAvailable
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : selectedSlot?.startTime === slot.startTime
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
                          }`}
                          title={slot.isAvailable ? 'Click to select' : slot.bookedReason || 'Reserved'}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consultation Type Radio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Consultation Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConsultationType('In-Person')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                        consultationType === 'In-Person'
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      In-Person Visit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsultationType('Online Video')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                        consultationType === 'Online Video'
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Online Video
                    </button>
                  </div>
                </div>

                {/* Reason for Consultation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Chief Complaint / Symptoms *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Mild chest discomfort, routine checkup, skin rash..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Fee Breakdown */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Payable at Clinic:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ${doctor.consultationFee}
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={bookingLoading || !selectedSlot}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
                >
                  {bookingLoading ? (
                    <span>Confirming with Clinic...</span>
                  ) : (
                    <span>
                      {selectedSlot ? `Confirm Appointment (${selectedSlot.startTime})` : 'Select a Time Slot'}
                    </span>
                  )}
                </button>

                {!isAuthenticated && (
                  <p className="text-[11px] text-center text-slate-400">
                    You will be prompted to log in as a patient to complete this reservation.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
